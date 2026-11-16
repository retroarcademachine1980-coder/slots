import { extensions } from '@wix/custom-extensions';

export default extensions.contextProvider({
  id: '947c9c08-2f40-4765-9f63-9fbd8c3e7c06',
  name: "town-places",
  type: "companionApp.townPlaces",
  displayName: "Town places",
  context: {
    items: {
      pageItems: { dataType: 'arrayItems', displayName: 'Cards on this page', arrayItems: { item: { dataType: 'data', data: { items: { title: { dataType: 'text', displayName: 'Title' }, town: { dataType: 'text', displayName: 'Town' }, rating: { dataType: 'text', displayName: 'Rating' }, image: { dataType: 'image', displayName: 'Image' }, link: { dataType: 'link', displayName: 'Link' } } } } } },
      pageText: { dataType: 'text', displayName: 'Page x of y' },
      prevPage: { dataType: 'function', displayName: 'Previous page', function: {} },
      nextPage: { dataType: 'function', displayName: 'Next page', function: {} },
      countText: { dataType: 'text', displayName: 'Results found' },
      welcome: { dataType: 'text', displayName: 'Welcome heading' },
      funHeading: { dataType: 'text', displayName: 'Start with the fun heading' },
      listHeading: { dataType: 'text', displayName: 'List heading' },
      planHeading: { dataType: 'text', displayName: 'Plan heading' },
      stopTitle: { dataType: 'text', displayName: 'Main attraction' },
      stopText: { dataType: 'text', displayName: 'Main attraction text' },
      stopImage: { dataType: 'image', displayName: 'Main attraction image' },
      stopLink: { dataType: 'link', displayName: 'Main attraction link' }
    },
  },
  data: {
    town: { dataType: 'text', defaultValue: '', deprecated: false, displayName: 'Town' },
    pageSize: { dataType: 'number', defaultValue: 6, deprecated: false, displayName: 'Cards per page' }
  },
  resources: {
    client: {
      url: './extensions/site/contexts/town-places/town-places.tsx',
    },
    contextSpecifier: {
      hook: 'useTownPlaces',
    },
  },
});
