export function bindSearchCard($item, itemData) {
    $item('#cardTitle').text = itemData.title || '';
    $item('#cardMeta').text = [itemData.subtitle, itemData.category]
        .filter(Boolean)
        .join(' · ');
    $item('#cardDescription').text = itemData.description || '';

    if (itemData.image) {
        $item('#cardImage').src = itemData.image;
        $item('#cardImage').alt = itemData.alt || itemData.title || '';
        $item('#cardImage').show();
    } else {
        $item('#cardImage').hide();
    }

    if (itemData.route) {
        $item('#cardButton').link = itemData.route;
        $item('#cardButton').enable();
    } else {
        $item('#cardButton').disable();
    }
}

export function bindCardRepeater(repeater, items) {
    repeater.onItemReady(($item, itemData) => bindSearchCard($item, itemData));
    repeater.data = items || [];
}
