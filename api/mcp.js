/**
 * Vercel Edge Function for Elementum MCP (Streamable HTTP JSON-RPC).
 * Serves POST /api/mcp (and /mcp via vercel.json rewrite) with ~15ms global latency and zero Node cold starts.
 */
import manifest from '../custom-elements.json';
import tokens from '../tokens/figma-tokens.json';
import pkg from '../package.json';
import metadata from '../mcp/component-metadata.json';
import sizeBudgets from '../size-budget.json';
import { createEdgeMcpHandler } from '../mcp/edge.js';

export const config = {
  runtime: 'edge',
};

export default createEdgeMcpHandler({ manifest, tokens, pkg, metadata, sizeBudgets });
