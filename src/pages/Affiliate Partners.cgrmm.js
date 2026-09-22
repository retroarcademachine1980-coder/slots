import { listPartners } from 'backend/directory.web';
import { bindCardRepeater } from 'public/cardBinder';

$w.onReady(async function () {
    const response = await listPartners({ limit: 100 });
    bindCardRepeater($w('#partnerRepeater'), response.results || []);
    $w('#partnerCount').text = response.total === 1
        ? '1 partner'
        : response.total + ' partners';
});
