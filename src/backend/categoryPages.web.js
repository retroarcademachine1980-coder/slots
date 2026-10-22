import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { queryCategoryVenues } from 'backend/category-query';

// Respect collection permissions; no suppressAuth and no CMS writes.
export const listCategoryVenues = webMethod(Permissions.Anyone, options =>
    queryCategoryVenues(wixData, options || {}));
