const DEFAULT_IDS = {
    title: '#cardTitle',
    meta: '#cardMeta',
    description: '#cardDescription',
    image: '#cardImage',
    button: '#cardButton'
};

export function bindSearchCard($item, itemData, ids = DEFAULT_IDS) {
    const map = { ...DEFAULT_IDS, ...ids };

    $item(map.title).text = itemData.title || '';
    $item(map.meta).text = [itemData.subtitle, itemData.category]
        .filter(Boolean)
        .join(' · ');
    $item(map.description).text = itemData.description || '';

    if (itemData.image) {
        $item(map.image).src = itemData.image;
        $item(map.image).alt = itemData.alt || itemData.title || '';
        $item(map.image).show();
    } else {
        $item(map.image).hide();
    }

    if (itemData.route) {
        $item(map.button).link = itemData.route;
        $item(map.button).enable();
    } else {
        $item(map.button).disable();
    }
}

export function bindCardRepeater(repeater, items, ids = DEFAULT_IDS) {
    repeater.onItemReady(($item, itemData) => bindSearchCard($item, itemData, ids));
    repeater.data = items || [];
}
