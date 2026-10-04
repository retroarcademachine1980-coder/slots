import { Permissions, webMethod } from 'wix-web-module';
import { resolveRoutePath } from 'backend/canonicalRoutesApi';
export const getCanonicalPage = webMethod(Permissions.Anyone, async path => resolveRoutePath(path));
