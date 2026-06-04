import { getTaskStats } from "./tasks.js";



export function initHomePage() {
    renderHomeStats();
    renderWeathercard();
    renderQuoteCard();
}



export function renderHomeStats() {
    const stats = getTaskStats();
    const totalTasksEl = document.getElementById("home-total-tasks");

    const completedTodayEl = document.getElementById("home-completed-today");

    const pendingTasksEl = document.getElementById("home-pending-tasks");

    if (!totalTasksEl || !completedTodayEl || !pendingTasksEl) {
        return;
    }

    totalTasksEl.textContent = stats.totalTasks;
    completedTodayEl.textContent = stats.completedToday;
    pendingTasksEl.textContent = stats.pendingTasks;

}


export async function renderWeathercard() {
    const weatherCard = document.querySelector('.weather-card');
    const weatherShimmer = document.getElementById('weather-shimmer');
    const weatherContent = document.getElementById('weather-content');
    
    const locationHeader = weatherCard?.querySelector('.location h4');
    const tempHeader = weatherCard?.querySelector('.temperature h2');
    const descHeader = weatherCard?.querySelector('.weather-description h5');

    if (!weatherCard || !locationHeader || !tempHeader || !descHeader) {
        return;
    }

    // Show shimmer, hide content
    if (weatherShimmer) weatherShimmer.style.display = 'flex';
    if (weatherContent) weatherContent.style.display = 'none';

    if (!navigator.geolocation) {
        locationHeader.textContent = 'Geolocation not supported';
        tempHeader.textContent = '--°C';
        descHeader.textContent = 'Weather unavailable';
        if (weatherShimmer) weatherShimmer.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });

        const result = await getData2loc(position.coords.latitude, position.coords.longitude);
        if (!result || !result.location || !result.current) {
            throw new Error('Invalid weather response');
        }

        locationHeader.textContent = `${result.location.name}, ${result.location.region} - ${result.location.country}`;
        tempHeader.textContent = `${Math.round(result.current.temp_c)}°C`;
        descHeader.textContent = result.current.condition?.text || 'Unknown condition';
    } catch (error) {
        locationHeader.textContent = 'Location unavailable';
        tempHeader.textContent = '--°C';
        descHeader.textContent = 'Unable to fetch weather';
        console.warn('Weather widget error:', error);
    } finally {
        // Hide shimmer, show content
        if (weatherShimmer) weatherShimmer.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';
    }
}

export async function renderQuoteCard() {
    const quoteTextEl = document.querySelector('.quote-card .quote-text');
    const quoteAuthorEl = document.querySelector('.quote-card .quote-author');
    const quoteShimmer = document.getElementById('quote-shimmer');
    const quoteContent = document.getElementById('quote-content');

    if (!quoteTextEl || !quoteAuthorEl) {
        return;
    }

    // Show shimmer, hide content
    if (quoteShimmer) quoteShimmer.style.display = 'flex';
    if (quoteContent) quoteContent.style.display = 'none';

    const targetKeywords = ['ambition', 'inspiration', 'goals', 'deterministic', 'motivat', 'success', 'persever'];
    
    try {
        // Check localStorage for today's quote
        const today = new Date().toDateString();
        const storedData = localStorage.getItem('todayQuote');
        
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.date === today) {
                quoteTextEl.textContent = parsed.text;
                quoteAuthorEl.textContent = `- ${parsed.author}`;
                if (quoteShimmer) quoteShimmer.style.display = 'none';
                if (quoteContent) quoteContent.style.display = 'block';
                return;
            }
        }

        // Fetch until we get a quote with target keywords
        let foundQuote = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!foundQuote && attempts < maxAttempts) {
            const response = await fetch('https://thequoteshub.com/api/', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Quote API error: ${response.status}`);
            }

            const data = await response.json();
            const quoteKeywords = Array.isArray(data?.tags) ? data.tags.map(k => k.toLowerCase()) : [];
            const hasTargetKeyword = targetKeywords.some(keyword => 
                quoteKeywords.some(quoteKey => quoteKey.includes(keyword))
            );
            const quoteText = data?.text || '';
            const isShortEnough = quoteText.length <= 100 && quoteText.length>=8;

            if (hasTargetKeyword && isShortEnough) {
                foundQuote = data;
            }
            attempts++;
        }

        if (foundQuote) {
            const quoteData = {
                date: today,
                text: foundQuote?.text || 'Stay focused and keep moving forward.',
                author: foundQuote?.author || 'Unknown',
            };
            localStorage.setItem('todayQuote', JSON.stringify(quoteData));
            quoteTextEl.textContent = quoteData.text;
            quoteAuthorEl.textContent = `- ${quoteData.author}`;
        } else {
            quoteTextEl.textContent = 'Stay focused and keep moving forward.';
            quoteAuthorEl.textContent = '- Keep pushing';
        }
    } catch (error) {
        quoteTextEl.textContent = 'Could not load quote of the day.';
        quoteAuthorEl.textContent = '- Please try again later';
        console.warn('Quote widget error:', error);
    } finally {
        // Hide shimmer, show content
        if (quoteShimmer) quoteShimmer.style.display = 'none';
        if (quoteContent) quoteContent.style.display = 'block';
    }
}

async function getData2loc(lat, long) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=03d14367cbbd4eefb98100940262605&q=${lat},${long}&aqi=yes`);
    return await response.json();
}


