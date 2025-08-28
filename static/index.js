// Sửa phần khai báo elements trong script.js
const elements = {
    searchBox: document.getElementById("search-box"),
    searchSuggestions: document.getElementById("search-suggestions"),
    suggestionsList: document.getElementById("suggestions-list"),
    translateContainer: document.getElementById("translate-container"),
    translateResult: document.getElementById("translate-result"),
    swapLangBtn: document.getElementById("swap-lang-btn"),
    bookmarksGrid: document.getElementById("bookmarks-grid"),
    addBookmarkBtn: document.getElementById("add-bookmark-btn"),
    time: document.getElementById("time"),
    date: document.getElementById("date"),
    greeting: document.getElementById("greeting"),
    todoList: document.getElementById("todo-list"),
    loadTodoBtn: document.getElementById("load-todo-btn"),
    todoFileInput: document.getElementById("todo-file-input"),
    alarmSoundFile: document.getElementById("alarm-sound-file"),
    alarmVolume: document.getElementById("alarm-volume"),
    testAlarmBtn: document.getElementById("test-alarm-btn"),
    alarmActive: document.getElementById("alarm-active"),
    alarmMessage: document.getElementById("alarm-message"),
    alarmSoundPlayer: document.getElementById("alarm-sound-player"),
    stopAlarmBtn: document.getElementById("stop-alarm-btn")
};

const searchEngines = {
    duckduckgo: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
};

const buttons = {
    "duckduckgo-btn": { type: "search", engine: "duckduckgo" },
    "translate-btn": { type: "toggleTranslate" }
};

let isEnglishToVietnamese = true;
let todoItems = [];
let alarmTimeout = null;
let selectedAlarmSound = null;
let isAlarmPlaying = false;
let currentAlarmTaskIndex = -1; // Lưu index của task đang kích hoạt alarm

function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    elements.time.textContent = `${hours}:${minutes} ${ampm}`;

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const day = now.getDate();
    const daySuffix = getDaySuffix(day);
    const weekday = weekdays[now.getDay()];
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    elements.date.textContent = `${weekday}, ${month} ${day}${daySuffix}, ${year}`;

    const hour = now.getHours();
    elements.greeting.textContent = hour < 12 ? 'Good morning!' : hour < 18 ? 'Good afternoon!' : 'Good evening!';

    setTimeout(updateTime, 1000);
}

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function deleteBookmark(index) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarks.splice(index, 1);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    loadBookmarks();
}

function loadBookmarks() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    elements.bookmarksGrid.innerHTML = bookmarks.map((bookmark, index) => `
        <div class="bookmark-item">
            <a href="${bookmark.url}" target="_blank">
                <img src="https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=16">
                <p>${bookmark.name}</p>
            </a>
            <button class="delete-bookmark" data-id="${index}">x</button>
        </div>
    `).join('');
    document.querySelectorAll('.delete-bookmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBookmark(parseInt(btn.dataset.id));
        });
    });
}

async function translateText() {
    const text = elements.searchBox.value.trim();
    if (!text) {
        elements.translateResult.value = "";
        return;
    }
    elements.translateResult.value = `Translating...`;
    const sourceLang = isEnglishToVietnamese ? 'en' : 'vi';
    const targetLang = isEnglishToVietnamese ? 'vi' : 'en';
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            elements.translateResult.value = data[0].map(item => item[0]).join('');
        } else {
            elements.translateResult.value = "Unable to translate this text.";
        }
    } catch (error) {
        elements.translateResult.value = `Connection error: ${error.message}`;
    }
}

function handleSearchButtonClick(type, config) {
    const keyword = elements.searchBox.value.trim();
    switch (type) {
        case "search":
            if (keyword) {
                saveSearchKeywords(keyword);
                hideSuggestions();
                window.open(searchEngines[config.engine](keyword), '_blank');
            }
            break;
        case "toggleTranslate":
            elements.translateContainer.style.display = elements.translateContainer.style.display === 'block' ? 'none' : 'block';
            if (elements.translateContainer.style.display === 'block') {
                translateText();
            }
            break;
        default:
            console.warn(`No handler for button type: ${type}`);
    }
}

function loadTodoListFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        parseTodoList(contents);
    };
    reader.readAsText(file);
}

function parseTodoList(content) {
    todoItems = [];
    const lines = content.split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        const timeActionMatch = line.match(/(\d{1,2})\.(\d{1,2}):\s*(.+)/);
        if (timeActionMatch) {
            const hour = parseInt(timeActionMatch[1]);
            const minute = parseInt(timeActionMatch[2]);
            const action = timeActionMatch[3];

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                todoItems.push({
                    hour,
                    minute,
                    action,
                    completed: false
                });
            }
        }
    });

    todoItems.sort((a, b) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
    });

    renderTodoList();
    setupAlarms();
}

function renderTodoList() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todoItems.forEach((item, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${item.completed ? 'completed' : ''}`;

        const time = `${item.hour.toString().padStart(2, '0')}:${item.minute.toString().padStart(2, '0')}`;

        todoItem.innerHTML = `
            <input type="checkbox" id="todo-${index}" ${item.completed ? 'checked' : ''}>
            <span class="todo-time">${time}</span>
            <span class="todo-action">${item.action}</span>
        `;

        const checkbox = todoItem.querySelector('input');
        checkbox.addEventListener('change', () => {
            todoItems[index].completed = checkbox.checked;
            todoItem.classList.toggle('completed', checkbox.checked);
            // Cập nhật lại báo thức khi trạng thái thay đổi
            setupAlarms();
        });

        todoList.appendChild(todoItem);
    });
}

function setupAlarms() {
    if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let nextTask = null;
    let minDiff = Infinity;

    for (const item of todoItems) {
        if (item.completed) continue;

        const taskTime = item.hour * 60 + item.minute;
        let diff = taskTime - currentTime;

        if (diff < 0) diff += 24 * 60;

        if (diff < minDiff) {
            minDiff = diff;
            nextTask = item;
        }
    }

    if (nextTask) {
        const alarmTime = minDiff * 60 * 1000;
        alarmTimeout = setTimeout(() => {
            const index = todoItems.findIndex(item => item === nextTask);
            showAlarmNotification(nextTask, index)
        }, alarmTime);

        console.log(`Alarm set for ${nextTask.hour}:${nextTask.minute} - ${nextTask.action} (in ${minDiff} minutes)`);
    }
}

function showAlarmNotification(task, index) {
    currentAlarmTaskIndex = index; // Lưu lại index

    // Hiển thị thông báo trình duyệt
    if (Notification.permission === 'granted') {
        new Notification('To-Do Alert', {
            body: `It's time for: ${task.action} (${task.hour}:${task.minute.toString().padStart(2, '0')})`,
            icon: './images/icon.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('To-Do Alert', {
                    body: `It's time for: ${task.action} (${task.hour}:${task.minute.toString().padStart(2, '0')})`,
                    icon: './images/icon.png'
                });
            }
        });
        isAlarmPlaying = true;
    }

    // Hiển thị popup báo thức
    elements.alarmMessage.textContent = `It's ${task.hour}:${task.minute.toString().padStart(2, '0')} - Time for: ${task.action}`;
    elements.alarmActive.style.display = 'block';

    // Phát âm thanh báo thức
    if (selectedAlarmSound) {
        isAlarmPlaying = true;
        elements.alarmSoundPlayer.src = selectedAlarmSound;
        elements.alarmSoundPlayer.volume = elements.alarmVolume.value / 100;
        elements.alarmSoundPlayer.play().catch(e => console.log('Audio play error:', e));
    }

    // Thiết lập lại báo thức sau khi kích hoạt
    setupAlarms();
}

function stopAlarm() {
    if (currentAlarmTaskIndex !== -1) {
        // Đánh dấu task đã hoàn thành
        todoItems[currentAlarmTaskIndex].completed = true;
        // Cập nhật giao diện
        renderTodoList();
        // Reset index
        currentAlarmTaskIndex = -1;
    }

    elements.alarmActive.style.display = 'none';
    if (isAlarmPlaying) {
        elements.alarmSoundPlayer.pause();
        elements.alarmSoundPlayer.currentTime = 0;
        isAlarmPlaying = false;
    }

    // Thiết lập lại alarm
    setupAlarms();
}

// Debounce function để tránh gọi API quá nhiều
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Hàm hiển thị gợi ý từ server
async function showServerSuggestions(input) {
    if (input.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(input)}`);
        const data = await response.json();

        if (data.suggestions && data.suggestions.length > 0) {
            displaySuggestions(data.suggestions);
        } else {
            hideSuggestions();
        }
    } catch (error) {
        console.error("Error fetching server suggestions:", error);
        // Fallback to local suggestions
        const localSuggestions = filterSuggestions(input);
        showSuggestions(localSuggestions);
    }
}

// Hàm hiển thị gợi ý
function displaySuggestions(suggestions) {
    elements.suggestionsList.innerHTML = '';

    if (suggestions.length > 0) {
        suggestions.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.keyword;
            li.tabIndex = 0;
            li.addEventListener('click', () => {
                elements.searchBox.value = item.keyword;
                hideSuggestions();
                performSearch();
            });
            elements.suggestionsList.appendChild(li);
        });

        elements.searchSuggestions.style.display = 'block';

        // Đặt vị trí cho suggestions container
        const searchBoxRect = elements.searchBox.getBoundingClientRect();
        elements.searchSuggestions.style.top = (searchBoxRect.bottom + window.scrollY) + 'px';
        elements.searchSuggestions.style.left = searchBoxRect.left + 'px';
        elements.searchSuggestions.style.width = searchBoxRect.width + 'px';
    } else {
        hideSuggestions();
    }
}

// Hàm hiển thị gợi ý từ localStorage
function showSuggestions(suggestions) {
    elements.suggestionsList.innerHTML = '';

    if (suggestions.length > 0) {
        suggestions.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.keyword;
            li.addEventListener('click', () => {
                elements.searchBox.value = item.keyword;
                hideSuggestions();
                performSearch();
            });
            elements.suggestionsList.appendChild(li);
        });

        elements.searchSuggestions.style.display = 'block';

        // Đặt vị trí cho suggestions container
        const searchBoxRect = elements.searchBox.getBoundingClientRect();
        elements.searchSuggestions.style.top = (searchBoxRect.bottom + window.scrollY) + 'px';
        elements.searchSuggestions.style.left = searchBoxRect.left + 'px';
        elements.searchSuggestions.style.width = searchBoxRect.width + 'px';
    } else {
        hideSuggestions();
    }
}

// Hàm ẩn gợi ý
function hideSuggestions() {
    elements.searchSuggestions.style.display = 'none';
}

// Hàm lưu từ khóa tìm kiếm
function saveSearchKeywords(query) {
    if (!query.trim()) return;

    // Lấy dữ liệu hiện tại từ localStorage
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    // Thêm từ khóa mới nếu chưa tồn tại (so sánh không phân biệt hoa thường)
    const lowerQuery = query.toLowerCase();
    if (!searchHistory.some(item => item.toLowerCase() === lowerQuery)) {
        searchHistory.push(query);
        // Giới hạn lịch sử để tránh quá lớn
        if (searchHistory.length > 100) {
            searchHistory = searchHistory.slice(-100);
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    // Đồng bộ với server
    syncSearchHistoryToServer(query);
}

// Hàm đồng bộ lịch sử tìm kiếm với server
function syncSearchHistoryToServer(searchQuery) {
    fetch('/api/save-search-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_query: searchQuery })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Search history saved to server:", data);
    })
    .catch(error => {
        console.error("Error saving search history to server:", error);
    });
}

// Hàm lấy lịch sử tìm kiếm
function getSearchHistory() {
    return JSON.parse(localStorage.getItem('searchHistory')) || [];
}

// Hàm lọc từ khóa gợi ý
function filterSuggestions(input) {
    const filtered = [];
    const inputLower = input.trim().toLowerCase();

    // Xử lý trường hợp input rỗng
    if (inputLower === '') return filtered;

    // Lấy lịch sử tìm kiếm từ localStorage
    const searchHistory = getSearchHistory();

    // Lọc các từ khóa phù hợp
    for (const keyword of searchHistory) {
        const keywordLower = keyword.toLowerCase();

        // Kiểm tra nếu từ khóa chứa input
        if (keywordLower.includes(inputLower)) {
            filtered.push({keyword: keyword});
        }
    }

    return filtered;
}

// Thêm hàm performSearch
function performSearch() {
    const query = elements.searchBox.value.trim();
    if (query) {
        saveSearchKeywords(query);
        window.open(searchEngines.google(query), '_blank');
    }
}

// Sự kiện input cho search box với debounce
const debouncedShowSuggestions = debounce(async (input) => {
    if (input.length >= 2) {
        // Ưu tiên lấy gợi ý từ server
        await showServerSuggestions(input);
    } else {
        hideSuggestions();
    }
}, 300);

// Event listeners
elements.searchBox.addEventListener('input', (e) => {
    const inputText = e.target.value;

    if (inputText.length >= 2) {
        debouncedShowSuggestions(inputText);
    } else {
        hideSuggestions();
    }
});

// Sự kiện focus cho search box
elements.searchBox.addEventListener("focus", (e) => {
    const inputText = e.target.value;
    if (inputText.length >= 2) {
        showServerSuggestions(inputText);
    }
});

// Sự kiện keypress cho search box
elements.searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && elements.searchBox.value.trim()) {
        const query = elements.searchBox.value.trim();
        saveSearchKeywords(query);
        hideSuggestions();
        window.open(searchEngines.google(query), '_blank');
    }
});

// Sự kiện click ra ngoài để ẩn gợi ý
document.addEventListener("click", (e) => {
    if (!elements.searchBox.contains(e.target) &&
        !elements.searchSuggestions.contains(e.target)) {
        hideSuggestions();
    }
});

// Sự kiện keydown cho search box (điều hướng bằng bàn phím)
elements.searchBox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && elements.searchSuggestions.style.display === 'block') {
        e.preventDefault();
        const firstSuggestion = elements.suggestionsList.querySelector('li');
        if (firstSuggestion) firstSuggestion.focus();
    }
});

// Sự kiện keydown cho danh sách gợi ý
elements.suggestionsList.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = e.target.nextElementSibling;
        if (next) next.focus();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = e.target.previousElementSibling;
        if (prev) {
            prev.focus();
        } else {
            elements.searchBox.focus();
        }
    } else if (e.key === "Enter") {
        e.preventDefault();
        elements.searchBox.value = e.target.textContent;
        hideSuggestions();
        elements.searchBox.focus();
    }
});

elements.swapLangBtn.addEventListener("click", () => {
    isEnglishToVietnamese = !isEnglishToVietnamese;
    translateText();
});

elements.addBookmarkBtn.addEventListener('click', () => {
    const name = prompt('Enter bookmark name:');
    const url = prompt('Enter URL:');
    if (name && url) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        bookmarks.push({ name, url });
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        loadBookmarks();
    }
});

Object.entries(buttons).forEach(([id, config]) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", () => handleSearchButtonClick(config.type, config));
});

elements.loadTodoBtn.addEventListener('click', () => {
    elements.todoFileInput.click();
});

elements.todoFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadTodoListFromFile(e.target.files[0]);
    }
});

elements.alarmSoundFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedAlarmSound = event.target.result;
            localStorage.setItem('alarmSound', selectedAlarmSound);
        };
        reader.readAsDataURL(file);
    }
});

elements.alarmVolume.addEventListener('change', () => {
    localStorage.setItem('alarmVolume', elements.alarmVolume.value);
});

elements.testAlarmBtn.addEventListener('click', () => {
    if (selectedAlarmSound) {
        isAlarmPlaying = true;
        elements.alarmSoundPlayer.src = selectedAlarmSound;
        elements.alarmSoundPlayer.volume = elements.alarmVolume.value / 100;
        elements.alarmSoundPlayer.play().catch(e => console.log('Audio play error:', e));

        // Stop after 3 seconds
        setTimeout(() => {
            if (isAlarmPlaying) {
                elements.alarmSoundPlayer.pause();
                elements.alarmSoundPlayer.currentTime = 0;
                isAlarmPlaying = false;
            }
        }, 3000);
    } else {
        alert('Please select an alarm sound first');
    }
});

elements.stopAlarmBtn.addEventListener('click', stopAlarm);

// Tải âm thanh báo thức đã lưu từ localStorage
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    loadBookmarks();

    // Tải âm thanh báo thức đã lưu
    const savedAlarmSound = localStorage.getItem('alarmSound');
    if (savedAlarmSound) {
        selectedAlarmSound = savedAlarmSound;
    }

    // Tải volume đã lưu
    const savedVolume = localStorage.getItem('alarmVolume');
    if (savedVolume) {
        elements.alarmVolume.value = savedVolume;
    }

    if ('Notification' in window) {
        Notification.requestPermission();
    }

    // Tải lịch sử tìm kiếm từ server khi khởi động
    fetch('/api/get-search-history')
        .then(response => response.json())
        .then(data => {
            if (data.history && data.history.length > 0) {
                // Kết hợp lịch sử từ server và localStorage
                const localHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
                const combinedHistory = [...new Set([...localHistory, ...data.history.map(item => item.keyword)])];
                localStorage.setItem('searchHistory', JSON.stringify(combinedHistory));
            }
        })
        .catch(error => {
            console.error("Error loading search history:", error);
        });
});
