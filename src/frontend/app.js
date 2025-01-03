// Quiz state
let currentQuestion = 0;
const totalQuestions = 10;
let playerName = '';
let scores = {
    today: [],
    overall: []
};
let allQuestions = [];  // Store all questions
let questions = [];      // Current quiz questions

// Add to top of file with other state variables
let lastPlayerName = '';
let passwordVerified = false;

// Add to state variables at top
const ADMIN_PASSWORD = 'admin';

// Load questions from JSON file
fetch('art-questions.json')
    .then(response => response.json())
    .then(data => {
        allQuestions = data.questions;  // Store all questions
        questions = [...allQuestions];   // Make a copy for current quiz
        questions = questions.sort(() => Math.random() - 0.5);
        console.log(`Loaded ${questions.length} questions`);
    })
    .catch(error => console.error('Error loading questions:', error));

// DOM Elements
const playerNameInput = document.getElementById('player-name');
const questionDisplay = document.querySelector('.question-display');
const answersGrid = document.querySelector('.answers-grid');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const todayScores = document.getElementById('today-scores');
const overallScores = document.getElementById('overall-scores');
const timeLeftDisplay = document.getElementById('time-left');
const pauseButton = document.getElementById('pause-button');
const skipButton = document.getElementById('skip-button');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const startButton = document.getElementById('start-button');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const CORRECT_PASSWORD = 'banksy';

let timer = null;
let timeLeft = 10;
let isPaused = false;

// Add current score tracking
let currentScore = 0;

// Load saved scores from localStorage
function loadSavedScores() {
    const savedScores = localStorage.getItem('artQuizScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        
        // Clear today's scores if they're from a previous day
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('artQuizLastDate');
        if (savedDate !== today) {
            scores.today = [];
            localStorage.setItem('artQuizLastDate', today);
        }
    }
    updateScoreboards();
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('artQuizScores', JSON.stringify(scores));
}

function startTimer() {
    timeLeft = 10;
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            timeLeftDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                handleTimeout();
            }
        }
    }, 1000);
}

function handleTimeout() {
    clearInterval(timer);
    
    // Show "Time's up!" message
    const timeupMessage = document.createElement('div');
    timeupMessage.className = 'timeout-message';
    timeupMessage.textContent = "Time's up!";
    answersGrid.appendChild(timeupMessage);
    
    // Disable all answer buttons
    const buttons = answersGrid.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);
    
    // Show correct answer
    const correctAnswer = questions[currentQuestion].answers.find(a => a.correct);
    if (correctAnswer) {
        const correctButton = Array.from(buttons)
            .find(button => button.textContent === correctAnswer.answer);
        if (correctButton) {
            correctButton.style.color = '#4CAF50';
            correctButton.style.fontWeight = 'bold';
        }
    }
    
    // Wait and move to next question
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < Math.min(totalQuestions, questions.length)) {
            showQuestion(currentQuestion);
        } else {
            endQuiz();
        }
    }, 1500);
}

function showQuestion(index) {
    const question = questions[index];
    if (!question) return;

    // Update question counter in top-right
    currentQuestionSpan.textContent = `${currentQuestion + 1}/10`;

    questionDisplay.textContent = question.question;
    answersGrid.innerHTML = '';
    
    // Randomize answer positions
    const shuffledAnswers = [...question.answers]
        .sort(() => Math.random() - 0.5);
    
    shuffledAnswers.forEach((answerObj) => {
        const button = document.createElement('button');
        button.textContent = answerObj.answer;
        button.className = 'answer-button';
        button.addEventListener('click', () => handleAnswer(answerObj.correct, index, answerObj.answer));
        answersGrid.appendChild(button);
    });

    // Update timer display
    timeLeftDisplay.textContent = timeLeft;
    startTimer();
}

function handleAnswer(isCorrect, questionIndex, selectedAnswer) {
    clearInterval(timer);
    const question = questions[questionIndex];

    // Show feedback
    const buttons = answersGrid.querySelectorAll('button');
    buttons.forEach((button) => {
        button.disabled = true;
        const correctAnswer = question.answers.find(a => a.correct).answer;
        
        if (isCorrect && button.textContent === selectedAnswer) {
            // If answer is correct, show green background
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            currentScore++;
        } else if (!isCorrect) {
            if (button.textContent === selectedAnswer) {
                // Show wrong answer in red
                button.style.backgroundColor = '#f44336';
                button.style.color = 'white';
            }
            if (button.textContent === correctAnswer) {
                // Show correct answer in bold green text
                button.style.color = '#4CAF50';
                button.style.fontWeight = 'bold';
            }
        }
    });

    // Wait before showing next question
    setTimeout(() => {
        currentQuestion++;
        
        if (currentQuestion < Math.min(totalQuestions, questions.length)) {
            showQuestion(currentQuestion);
        } else {
            endQuiz();
        }
    }, 1500);
}

function initQuiz() {
    // Clear inputs on page load
    playerNameInput.value = '';
    passwordInput.value = '';
    playerName = '';
    startButton.disabled = true;
    
    loadSavedScores();

    function validateInputs() {
        const nameValid = playerNameInput.value.trim() !== '';
        const passwordValid = passwordInput.value === CORRECT_PASSWORD;
        playerName = playerNameInput.value.trim();
        
        console.log('Validating inputs:');
        console.log('Name:', playerName);
        console.log('Password entered:', passwordInput.value);
        console.log('Expected password:', CORRECT_PASSWORD);
        console.log('Password valid:', passwordValid);
        console.log('Start button disabled:', startButton.disabled);
        
        if (passwordInput.value && !passwordValid) {
            passwordError.textContent = 'Incorrect password';
            passwordInput.classList.add('error');
            passwordInput.classList.remove('password-valid');
        } else if (passwordValid) {
            passwordError.textContent = '';
            passwordInput.classList.remove('error');
            passwordInput.classList.add('password-valid');
        } else {
            passwordError.textContent = '';
            passwordInput.classList.remove('error');
            passwordInput.classList.remove('password-valid');
        }
        
        startButton.disabled = !(nameValid && passwordValid);
    }

    playerNameInput.addEventListener('input', validateInputs);
    passwordInput.addEventListener('input', validateInputs);

    startButton.onclick = () => {
        console.log('Start button clicked');
        console.log('Player name:', playerName);
        console.log('Password valid:', passwordInput.value === CORRECT_PASSWORD);
        
        if (playerName && passwordInput.value === CORRECT_PASSWORD) {
            console.log('Starting quiz...');
            startScreen.style.display = 'none';
            quizScreen.style.display = 'block';
            startQuiz();
        } else {
            console.log('Validation failed:', { playerName, password: passwordInput.value });
        }
    };

    updateScoreboards();
    currentQuestionSpan.textContent = currentQuestion + 1;
    totalQuestionsSpan.textContent = Math.min(totalQuestions, questions.length);
}

function startQuiz() {
    currentQuestion = 0;
    currentScore = 0;  // Reset score
    showQuestion(currentQuestion);
}

// Add reset scores functionality
function resetScores() {
    const adminPassword = prompt('Enter admin password to reset scores:');
    if (adminPassword === ADMIN_PASSWORD) {
        const confirmReset = confirm('Are you sure you want to reset all scores? This cannot be undone.');
        if (confirmReset) {
            scores = {
                today: [],
                overall: []
            };
            saveScores();
            updateScoreboards();
            alert('Scores have been reset.');
        }
    } else {
        alert('Incorrect admin password.');
    }
}

// Update scoreboards and endQuiz functions remain the same
function updateScoreboards() {
    const sortedToday = [...scores.today].sort((a, b) => b.score - a.score);
    const sortedOverall = [...scores.overall].sort((a, b) => b.score - a.score);

    console.log('Updating scoreboards:');
    console.log('Today scores:', sortedToday);
    console.log('Overall scores:', sortedOverall);

    // Add reset button above scores
    const resetButton = `
        <button onclick="resetScores()" 
                style="margin-bottom: 10px; padding: 5px 10px; 
                       background: #ff4444; color: white; 
                       border: none; border-radius: 4px;
                       cursor: pointer;">
            Reset Scores
        </button>
    `;

    todayScores.innerHTML = 
        resetButton +
        sortedToday
            .slice(0, 10)
            .map(score => {
                const rating = getRating(score.score);
                console.log(`Score ${score.score} gets color ${rating.color} (${rating.title})`);
                return `<div class="score-entry">
                    <span>${score.name}</span>
                    <span style="color: ${rating.color}; font-weight: bold; font-size: 16px; text-shadow: 0 0 1px rgba(0,0,0,0.2);">${score.score}/10</span>
                </div>`;
            })
            .join('');

    overallScores.innerHTML = sortedOverall
        .slice(0, 10)
        .map(score => {
            const rating = getRating(score.score);
            console.log(`Score ${score.score} gets color ${rating.color} (${rating.title})`);
            return `<div class="score-entry">
                <span style="opacity: 0.7; font-size: 12px;">${score.date || 'Classic'}</span>
                <span>${score.name}</span>
                <span style="color: ${rating.color}; font-weight: bold; font-size: 16px; text-shadow: 0 0 1px rgba(0,0,0,0.2);">${score.score}/10</span>
            </div>`;
        })
        .join('');
}

function endQuiz() {
    clearInterval(timer);
    
    // Hide timer and controls
    document.querySelector('.timer-controls').style.display = 'none';
    
    // Show end screen
    questionDisplay.textContent = 'Quiz Complete!';
    
    // Get rating based on score
    const rating = getRating(currentScore);
    
    answersGrid.innerHTML = `
        <div class="end-screen">
            <p class="final-score" style="color: ${rating.color}; font-weight: bold; font-size: 24px;">
                Your final score: ${currentScore}/10
            </p>
            <p class="rating-title" style="font-weight: bold; font-size: 20px;">
                You have achieved ${rating.title} status!
            </p>
            <button onclick="restartQuiz()" class="play-again">Play Again</button>
        </div>
    `;
    
    // Update high scores with date
    const today = new Date().toISOString().split('T')[0];
    scores.today.push({ name: playerName, score: currentScore });
    scores.overall.push({ name: playerName, score: currentScore, date: today });
    
    // Fix the slice operation for more scores
    scores.today = scores.today.sort((a, b) => b.score - a.score).slice(0, 10);
    scores.overall = scores.overall.sort((a, b) => b.score - a.score).slice(0, 10);
    
    saveScores();
    updateScoreboards();
}

function getRating(score) {
    const ratings = [
        { score: 0, color: '#0000FF', title: 'John Baldessari' },      // Deep Blue
        { score: 1, color: '#0040FF', title: 'Yoko Ono' },            // Blue
        { score: 2, color: '#0080FF', title: 'Hans Haacke' },         // Light Blue
        { score: 3, color: '#00C0FF', title: 'Adrian Piper' },        // Sky Blue
        { score: 4, color: '#00FFFF', title: 'Lawrence Weiner' },     // Cyan
        { score: 5, color: '#FF00FF', title: 'Marina Abramović' },    // Magenta
        { score: 6, color: '#FF0080', title: 'Jenny Holzer' },        // Pink
        { score: 7, color: '#FF0040', title: 'Bruce Nauman' },        // Rose
        { score: 8, color: '#FF0000', title: 'Marcel Broodthaers' },  // Red
        { score: 9, color: '#C00000', title: 'Marcel Duchamp' },      // Dark Red
        { score: 10, color: '#800000', title: 'Joseph Beuys' }        // Deep Red
    ];
    return ratings[score];
}

// Fix pause functionality
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '▶️' : '⏸️';
    
    // Add visual feedback for paused state
    if (isPaused) {
        answersGrid.style.opacity = '0.7';
        questionDisplay.style.opacity = '0.7';
    } else {
        answersGrid.style.opacity = '1';
        questionDisplay.style.opacity = '1';
    }
});

// Add skip functionality
skipButton.addEventListener('click', () => {
    clearInterval(timer);
    currentQuestion++;
    currentQuestionSpan.textContent = currentQuestion + 1;
    
    if (currentQuestion < questions.length) {
        showQuestion(currentQuestion);
    } else {
        endQuiz();
    }
});

// Add new restart function instead of location.reload():
function restartQuiz() {
    // Get fresh copy of questions and shuffle
    questions = [...allQuestions].sort(() => Math.random() - 0.5);
    
    startScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    currentQuestion = 0;
    currentScore = 0;
    document.querySelector('.timer-controls').style.display = 'flex';
    showQuestion(currentQuestion);
}

document.addEventListener('DOMContentLoaded', initQuiz); 

// Password validation
passwordInput.addEventListener('input', () => {
    console.log('Password input:', passwordInput.value);
    const password = passwordInput.value;
    const error = document.getElementById('password-error');
    
    if (password === 'banksy') {
        error.textContent = '';
        startButton.disabled = false;
        console.log('Password correct, button enabled');
    } else {
        error.textContent = 'Invalid password';
        startButton.disabled = true;
        console.log('Password incorrect, button disabled');
    }
}); 