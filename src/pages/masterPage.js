function applyArchiveCardImageOverride(repeater) {
    repeater.forEachItem(($item, itemData) => {
        if (!itemData || itemData.title !== "Andy Capp (1991 Blue Edition)" || !itemData.cardImage) {
            return;
        }

        const itemImages = $item("Image");
        itemImages.forEach((image) => {
            if (!itemData.heroImage || image.src === itemData.heroImage || image.src.includes("3a517e_178c5e0e818c4cb098d164c8419a6131~mv2.png")) {
                image.src = itemData.cardImage;
            }
        });
    });
}

$w.onReady(function () {
    // No automatic rating calculations or database saves.
    // Ratings must only change after a deliberate submission.

    const repeaters = $w("Repeater");

    repeaters.forEach((repeater) => {
        repeater.onItemReady(($item, itemData) => {
            if (!itemData || itemData.title !== "Andy Capp (1991 Blue Edition)" || !itemData.cardImage) {
                return;
            }

            const itemImages = $item("Image");
            itemImages.forEach((image) => {
                if (!itemData.heroImage || image.src === itemData.heroImage || image.src.includes("3a517e_178c5e0e818c4cb098d164c8419a6131~mv2.png")) {
                    image.src = itemData.cardImage;
                }
            });
        });
    });

    const datasets = $w("Dataset");
    datasets.forEach((dataset) => {
        dataset.onReady(() => {
            repeaters.forEach(applyArchiveCardImageOverride);
        });
    });

    repeaters.forEach(applyArchiveCardImageOverride);
});
