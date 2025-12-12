import {
    type RouteConfigEntry,
    index,
    route,
} from '@react-router/dev/routes';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

type Tree = {
	path: string;
	children: Tree[];
	hasPage: boolean;
	hasRoute: boolean; // Added for route.js/route.ts files
	isParam: boolean;
	paramName: string;
	isCatchAll: boolean;
};

function buildRouteTree(dir: string, basePath = ''): Tree {
	const files = readdirSync(dir);
	const node: Tree = {
		path: basePath,
		children: [],
		hasPage: false,
		hasRoute: false, // Initialize hasRoute
		isParam: false,
		isCatchAll: false,
		paramName: '',
	};

	// Check if the current directory name indicates a parameter
	const dirName = basePath.split('/').pop();
	if (dirName?.startsWith('[') && dirName.endsWith(']')) {
		node.isParam = true;
		const paramName = dirName.slice(1, -1);

		// Check if it's a catch-all parameter (e.g., [...ids])
		if (paramName.startsWith('...')) {
			node.isCatchAll = true;
			node.paramName = paramName.slice(3); // Remove the '...' prefix
		} else {
			node.paramName = paramName;
		}
	}

	for (const file of files) {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			// Convert [param] to :param in the path when building tree
			let childPath = basePath ? `${basePath}/${file}` : file;
			
			// Process parameter syntax in folder names
			if (file.startsWith('[') && file.endsWith(']')) {
				const paramName = file.slice(1, -1);
				if (paramName.startsWith('...')) {
					childPath = basePath ? `${basePath}/*` : '*';
				} else if (paramName.startsWith('[') && paramName.endsWith(']')) {
					childPath = basePath ? `${basePath}/:${paramName.slice(1, -1)}?` : `:${paramName.slice(1, -1)}?`;
				} else {
					childPath = basePath ? `${basePath}/:${paramName}` : `:${paramName}`;
				}
			}
			
			const childNode = buildRouteTree(filePath, childPath);
			node.children.push(childNode);
		} else if (file === 'page.jsx' || file === 'page.tsx') {
			node.hasPage = true;
		} else if (file === 'route.js' || file === 'route.ts') {
			node.hasRoute = true;
    }
	}

	return node;
}

function generateRoutes(node: Tree): RouteConfigEntry[] {
	const routes: RouteConfigEntry[] = [];

	if (node.hasPage) {
		// Determine file extension - need to use the actual folder structure, not the processed path
		const actualPath = node.path.replace(/:\w+\??|\*/g, (match) => {
			// Convert :param back to [param], :param? to [[param]], * to [...param]
			if (match === '*') return '[...param]';
			if (match.endsWith('?')) return `[[${match.slice(1, -1)}]]`;
			return `[${match.slice(1)}]`;
		});
		
		const ext = require('fs').existsSync(join(__dirname, actualPath, 'page.tsx')) ? 'tsx' : 'jsx';
		const componentPath =
			actualPath === '' ? `./${actualPath}page.${ext}` : `./${actualPath}/page.${ext}`;

		if (node.path === '') {
			routes.push(index(componentPath));
		} else {
			// Path is already processed with : syntax
			routes.push(route(node.path, componentPath));
		}
	}
	
	// Handle route.js/route.ts files (for API routes)
	if (node.hasRoute) {
		const routePath = `/${node.path}`;
		const ext = require('fs').existsSync(join(__dirname, node.path, 'route.ts')) ? 'ts' : 'js';
		const componentPath = node.path ? `./${node.path}/route.${ext}` : `./route.${ext}`;
		routes.push(route(routePath, componentPath));
	}

	for (const child of node.children) {
		routes.push(...generateRoutes(child));
	}

	return routes;
}{jsx,tsx}
if (import.meta.env.DEV) {
	import.meta.glob('./**/page.jsx', {});
	if (import.meta.hot) {
		import.meta.hot.accept((newSelf) => {
			import.meta.hot?.invalidate();
		});
	}
}
const tree = buildRouteTree(__dirname);
const notFound = route('*?', './__create/not-found.tsx');
const routes = [...generateRoutes(tree), notFound];

export default routes;
