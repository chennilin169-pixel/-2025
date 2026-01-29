const targetDate = document.body.dataset.targetDate
    ? new Date(document.body.dataset.targetDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const timeElements = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds')
};

const progressBar = document.getElementById('progressBar');
const countdownNote = document.getElementById('countdownNote');

const totalDuration = targetDate.getTime() - Date.now();

function formatNumber(value) {
    return String(value).padStart(2, '0');
}

function updateCountdown() {
    const now = Date.now();
    const remaining = targetDate.getTime() - now;

    if (remaining <= 0) {
        timeElements.days.textContent = '00';
        timeElements.hours.textContent = '00';
        timeElements.minutes.textContent = '00';
        timeElements.seconds.textContent = '00';
        progressBar.style.width = '100%';
        countdownNote.textContent = '星律已同调，新的旅程即刻启航。';
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timeElements.days.textContent = formatNumber(days);
    timeElements.hours.textContent = formatNumber(hours);
    timeElements.minutes.textContent = formatNumber(minutes);
    timeElements.seconds.textContent = formatNumber(seconds);

    const elapsed = totalDuration - remaining;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    progressBar.style.width = `${progress.toFixed(2)}%`;

    countdownNote.textContent = `距离星律同调尚余 ${days} 天 ${hours} 小时 ${minutes} 分。`;
}

updateCountdown();
setInterval(updateCountdown, 1000);
