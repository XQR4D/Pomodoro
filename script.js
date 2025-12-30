let currentLanguage = localStorage.getItem('language') || 'ru';
let currentTheme = localStorage.getItem('theme') || 'light';

const translations = {
    ru: {
        title: 'Помодоро Таймер',
        subtitle: 'Управляйте своим временем и работайте продуктивнее!',
        timerTitle: 'Таймер Помодоро',
        tasksTitle: 'Задачи',
        setTimer25: '25 мин (Стандарт)',
        setTimer5: '5 мин (Короткий перерыв)',
        setTimer15: '15 мин (Длинный перерыв)',
        addTaskPlaceholder: 'Добавить задачу',
        addTaskButton: 'Добавить',
        sessionLengthLabel: 'Кастомная длительность (мин):',
        start: 'Начать',
        reset: 'Сбросить'
    },
    en: {
        title: 'Pomodoro Timer',
        subtitle: 'Manage your time and work more productively!',
        timerTitle: 'Pomodoro Timer',
        tasksTitle: 'Tasks',
        setTimer25: '25 min (Standard)',
        setTimer5: '5 min (Short Break)',
        setTimer15: '15 min (Long Break)',
        addTaskPlaceholder: 'Add task',
        addTaskButton: 'Add',
        sessionLengthLabel: 'Custom duration (min):',
        start: 'Start',
        reset: 'Reset'
    }
};

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ru' ? 'en' : 'ru';
    localStorage.setItem('language', currentLanguage);
    updateText();
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    document.body.classList.toggle('dark', currentTheme === 'dark');
    document.getElementById('themeButton').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
}

function updateText() {
    const t = translations[currentLanguage];
    document.getElementById('title').innerText = t.title;
    document.getElementById('subtitle').innerText = t.subtitle;
    document.getElementById('timerTitle').innerText = t.timerTitle;
    document.getElementById('tasksTitle').innerText = t.tasksTitle;
    document.getElementById('setTimer25').innerText = t.setTimer25;
    document.getElementById('setTimer5').innerText = t.setTimer5;
    document.getElementById('setTimer15').innerText = t.setTimer15;
    document.getElementById('newTask').placeholder = t.addTaskPlaceholder;
    document.getElementById('addTaskButton').innerText = t.addTaskButton;
    document.getElementById('sessionLengthLabel').innerText = t.sessionLengthLabel;
    document.getElementById('start').innerText = t.start;
    document.getElementById('reset').innerText = t.reset;
}

document.addEventListener('DOMContentLoaded', () => {
    updateText();
    document.body.classList.toggle('dark', currentTheme === 'dark');
    document.getElementById('themeButton').textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const clickSound = new Audio('assets/audio/click.mp3');
    clickSound.volume = 0.1;
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });

    const completionSound = document.getElementById('completionSound');

    let timer;
    let isRunning = false;
    let timeLeft = 25 * 60;
    let totalTime = timeLeft;

    const timeDisplay = document.getElementById('time');
    const progressCircle = document.querySelector('.progress-ring__circle');
    const startButton = document.getElementById('start');
    const resetButton = document.getElementById('reset');
    const sessionLengthInput = document.getElementById('sessionLength');

    const circumference = 880;

    // Ключ для хранения состояния таймера
    const TIMER_STORAGE_KEY = 'pomodoroTimerState';

    function updateTimeDisplay() {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${minutes}:${seconds}`;
    }

    function updateProgress() {
        const offset = circumference - (circumference * (timeLeft / totalTime));
        progressCircle.style.strokeDashoffset = offset;
    }

    function saveTimerState() {
        const state = {
            timeLeft,
            totalTime,
            isRunning,
            customMinutes: sessionLengthInput.value || Math.round(totalTime / 60)
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    }

    function loadTimerState() {
        const saved = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!saved) return false;

        try {
            const state = JSON.parse(saved);
            timeLeft = state.timeLeft ?? 25 * 60;
            totalTime = state.totalTime ?? timeLeft;
            isRunning = state.isRunning ?? false;
            if (state.customMinutes) {
                sessionLengthInput.value = state.customMinutes;
            }
            updateTimeDisplay();
            updateProgress();
            startButton.textContent = isRunning 
                ? (currentLanguage === 'ru' ? 'Пауза' : 'Pause') 
                : translations[currentLanguage].start;

            if (isRunning) {
                startTimerInternal();
            }
            return true;
        } catch (e) {
            console.error('Failed to load timer state', e);
            return false;
        }
    }

    function clearTimerState() {
        localStorage.removeItem(TIMER_STORAGE_KEY);
    }

    function setTimer(minutes) {
        sessionLengthInput.value = minutes;
        timeLeft = minutes * 60;
        totalTime = timeLeft;
        updateTimeDisplay();
        updateProgress();
        saveTimerState();
    }

    function startTimerInternal() {
        isRunning = true;
        startButton.textContent = currentLanguage === 'ru' ? 'Пауза' : 'Pause';
        saveTimerState();

        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimeDisplay();
                updateProgress();
                saveTimerState();
            } else {
                clearInterval(timer);
                isRunning = false;
                startButton.textContent = translations[currentLanguage].start;
                completionSound.play();
                alert(currentLanguage === 'ru' ? 'Сессия завершена!' : 'Session completed!');
                if (Notification.permission === 'granted') {
                    new Notification('Pomodoro', { 
                        body: currentLanguage === 'ru' ? 'Время сессии истекло!' : 'Time is up!' 
                    });
                }
                clearTimerState();
            }
        }, 1000);
    }

    function togglePause() {
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
            startButton.textContent = translations[currentLanguage].start;
            saveTimerState();
        } else {
            startTimerInternal();
        }
    }

    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        startButton.textContent = translations[currentLanguage].start;

        const customMin = Number(sessionLengthInput.value);
        const minutes = isNaN(customMin) || customMin <= 0 ? 25 : customMin;
        sessionLengthInput.value = minutes;

        timeLeft = minutes * 60;
        totalTime = timeLeft;
        updateTimeDisplay();
        updateProgress();
        saveTimerState();
    }

    startButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetTimer);

    window.setTimer = setTimer;
    updateTimeDisplay();
    updateProgress();

    // Загрузка состояния таймера
    loadTimerState();

    // Если состояние не было загружено — устанавливаем значения по умолчанию
    if (!localStorage.getItem(TIMER_STORAGE_KEY)) {
        sessionLengthInput.value = 25;
        setTimer(25);
    }

    const taskInput = document.getElementById('newTask');
    const taskList = document.getElementById('taskList');

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        taskList.innerHTML = '';
        tasks.forEach(task => addTaskToDOM(task));
    }

    function addTaskToDOM(task) {
        const li = document.createElement('li');
        li.classList.add('task-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            span.classList.toggle('completed', checkbox.checked);
            if (checkbox.checked) removeTask(task);
        });

        const span = document.createElement('span');
        span.textContent = task;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.classList.add('delete-button');
        deleteBtn.addEventListener('click', () => removeTask(task));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks.push(text);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            addTaskToDOM(text);
            taskInput.value = '';
        }
    }

    function removeTask(taskToRemove) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(t => t !== taskToRemove);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
    }

    document.getElementById('addTaskButton').addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTask();
    });

    loadTasks();
});