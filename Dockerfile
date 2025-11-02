# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Add standalone output mode to next.config.ts (single-line to avoid Dockerfile parse issues)
RUN node -e 'const fs=require("fs"),path=require("path");const p=path.join(process.cwd(),"next.config.ts");if(!fs.existsSync(p)){console.log("next.config.ts not found");process.exit(0)}let s=fs.readFileSync(p,"utf8");if(/output\s*:\s*["\']standalone["\']/.test(s)){console.log("output already present");process.exit(0)}
// Try patterns: const nextConfig = { ... }, module.exports = { ... }, export default { ... }, export default name; (name = { ... })
const tried=[];
// 1) const/let/var nextConfig = {
const reConst=/([const|let|var]+)\s+([A-Za-z0-9_]+)\s*=[^\{]*\{/m;
if(reConst.test(s)){
    s=s.replace(reConst, (m,decl,name)=>`${m}\n  output: \"standalone\",`);
    tried.push('const-like');
}
// 2) module.exports = {
const reModule=/module\.exports\s*=\s*\{/m;
if(reModule.test(s) && !tried.includes('module')){
    s=s.replace(reModule, m=>m+"\n  output: \"standalone\",");
    tried.push('module');
}
// 3) export default { ... }
const reExportObj=/export\s+default\s*\{\s*/m;
if(reExportObj.test(s) && !tried.includes('exportObj')){
    s=s.replace(reExportObj, m=>m+"\n  output: \"standalone\",");
    tried.push('exportObj');
}
// 4) export default identifier; try to find identifier declaration
const reExportId=/export\s+default\s+([A-Za-z0-9_]+)/m;
const mId=s.match(reExportId);
if(mId && !tried.includes('exportId')){
    const id=mId[1];
    // find const id = { ... }
    const reIdDecl=new RegExp('([const|let|var]+)\\s+'+id+'\\s*=[^\\{]*\\{','m');
    if(reIdDecl.test(s)){
        s=s.replace(reIdDecl, m=>m+"\n  output: \"standalone\",");
        tried.push('exportId');
    }
}
if(tried.length>0){fs.writeFileSync(p,s);console.log('Injected output into next.config.ts patterns: '+tried.join(','))}else{console.log('No matching pattern to inject output into next.config.ts')}'

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy environment example
COPY --chown=nextjs:nodejs .env.example .env.local

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run the application
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
