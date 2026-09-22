import { listLocations, listRecommendations, listAttractions } from 'backend/directory.web';
import { bindCardRepeater } from 'public/cardBinder';

$w.onReady(async function () {
    const [locations, hotels, food, attractions] = await Promise.all([
        listLocations({ limit: 12 }),
        listRecommendations({ category: 'hotel', limit: 12 }),
        listRecommendations({ category: 'food', limit: 12 }),
        listAttractions({ limit: 12 })
    ]);

    bindCardRepeater($w('#destinationRepeater'), locations.results || [], {
        title: '#destinationTitle', meta: '#destinationMeta', description: '#destinationDescription',
        image: '#destinationImage', button: '#destinationButton'
    });
    bindCardRepeater($w('#hotelRepeater'), hotels.results || [], {
        title: '#hotelTitle', meta: '#hotelMeta', description: '#hotelDescription',
        image: '#hotelImage', button: '#hotelButton'
    });
    bindCardRepeater($w('#foodRepeater'), food.results || [], {
        title: '#foodTitle', meta: '#foodMeta', description: '#foodDescription',
        image: '#foodImage', button: '#foodButton'
    });
    bindCardRepeater($w('#attractionRepeater'), attractions.results || [], {
        title: '#attractionTitle', meta: '#attractionMeta', description: '#attractionDescription',
        image: '#attractionImage', button: '#attractionButton'
    });
});
