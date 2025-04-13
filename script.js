/**
 * ChatterBot - Main Script
 * Handles UI interactions and chat functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveSettings = document.getElementById('save-settings');
    const themeOptions = document.querySelectorAll('.theme-option');
    const suggestionPills = document.querySelectorAll('.suggestion-pill');
    const emojiButton = document.getElementById('emoji-button');
    const emojiPicker = document.getElementById('emoji-picker');
    const scrollDownButton = document.getElementById('scroll-down-button');
    const scrollUpButton = document.getElementById('scroll-up-button');
    const infoButton = document.querySelector('.bg-yellow-400');
    
    // Chat history
    let chatHistory = [];

    // Theme
    let currentTheme = localStorage.getItem('theme') || 'default';
    let currentBubbleStyle = localStorage.getItem('bubbleStyle') || 'rounded';
    let currentFontSize = localStorage.getItem('fontSize') || 'medium';
    // Apply settings from localStorage
    applyTheme(currentTheme);
    applyBubbleStyle(currentBubbleStyle);
    applyFontSize(currentFontSize);
    
    // Initialize emoji picker
    initEmojiPicker();
    
    const suggestions = [
        "Tell me a fun fact",
        "Tell me a joke",
        "How do I cook pasta?",
        "What's the capital of France?",
        "Give me a workout tip",
        "What's a good travel destination?",
        "How do I improve my coding skills?",
        "What is AI?",
        "How do I stay productive?",
        "What's the best way to learn a new language?",
        "Tell me a quote of the day",
        "How do I get better at public speaking?",
        "What's the meaning of life?",
        "How do I manage stress?",
        "What are some healthy snacks?",
        "What's the tallest mountain in the world?",
        "How do I create a budget?",
        "What's the latest tech trend?",
        "What are some beginner programming languages?",
        "Tell me something interesting about space",
        "How do I start a blog?",
        "What are your hobbies?",
        "What's your favorite movie?",
        "How can I sleep better?",
        "What's a must-read book?",
        "How do I improve my memory?",
        "What's a simple recipe I can try?"
    ];
    
    
    function displayRandomSuggestions() {
        const suggestionContainer = document.querySelector('.flex-wrap');
        suggestionContainer.innerHTML = ''; // Clear existing suggestions
    
        // Shuffle suggestions and select a few
        const shuffledSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
    
        shuffledSuggestions.forEach(suggestion => {
            const button = document.createElement('button');
            const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            button.className = `suggestion-pill ${randomColor} text-white px-3 py-1 rounded-full text-sm hover:${randomColor} hover:bg-opacity-80 transition-colors`;
            button.textContent = suggestion;
            button.addEventListener('click', function() {
                chatInput.value = suggestion;
                sendMessage();
            });
            suggestionContainer.appendChild(button);
        });
    }
    
    // Add typing effect to bot messages
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-bubble bot-bubble typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        typingDiv.id = 'typing-indicator';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble user-bubble';
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        // Add to chat history
        chatHistory.push({ role: 'user', content: message });
        saveChatHistory(); // Save history after adding a message
    }
    
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble bot-bubble';
        messageDiv.innerHTML = processMessageContent(message);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        // Add to chat history
        chatHistory.push({ role: 'assistant', content: message });
        saveChatHistory(); // Save history after adding a message
    }
    
    // Process message content for markdown and code blocks
    function processMessageContent(content) {
        // Process code blocks (```code```)
        content = content.replace(/```(\w*)([\s\S]*?)```/g, function(match, language, code) {
            return `<pre>${code.trim()}</pre>`;
        });
        
        // Process inline code (`code`)
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Process links
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Process bold text
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Process italic text
        content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    // Send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;
        
        // Clear input
        chatInput.value = '';
        
        // Add user message
        addUserMessage(message);
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get response from API
            const response = await groqApi.generateResponse(chatHistory);
            
            // Remove typing indicator and add bot message
            removeTypingIndicator();
            addBotMessage(response);
        } catch (error) {
            // Handle errors
            removeTypingIndicator();
            addBotMessage(`⚠️ Error: ${error.message}`);
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Settings modal functions
    settingsButton.addEventListener('click', function() {
        // Show modal
        settingsModal.classList.add('active');
        settingsModal.style.display = 'flex';
        
        // Highlight current selections
        highlightCurrentSettings();
    });

    closeSettings.addEventListener('click', function() {
        settingsModal.classList.remove('active');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
    });

    saveSettings.addEventListener('click', function() {
        // Close modal
        settingsModal.classList.remove('active');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
        
        // Show confirmation message
        addBotMessage("✅ Settings saved! Your customizations have been applied.");
    });

    // Theme options
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('theme', theme);
            highlightCurrentSettings();
        });
    });

    // Bubble style options
    const bubbleStyleOptions = document.querySelectorAll('.bubble-style-option');
    bubbleStyleOptions.forEach(option => {
        option.addEventListener('click', function() {
            const style = this.dataset.style;
            applyBubbleStyle(style);
            localStorage.setItem('bubbleStyle', style);
            highlightCurrentSettings();
        });
    });

    // Font size options
    const fontSizeOptions = document.querySelectorAll('.font-size-option');
    fontSizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const size = this.dataset.size;
            applyFontSize(size);
            localStorage.setItem('fontSize', size);
            highlightCurrentSettings();
        });
    });

    function applyTheme(theme) {
        document.body.className = '';
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        currentTheme = theme;
    }

    function applyBubbleStyle(style) {
        document.body.classList.remove('bubble-style-rounded', 'bubble-style-square', 'bubble-style-modern');
        document.body.classList.add(`bubble-style-${style}`);
        currentBubbleStyle = style;
    }

    function applyFontSize(size) {
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        document.body.classList.add(`font-size-${size}`);
        currentFontSize = size;
    }

    function highlightCurrentSettings() {
        // Highlight theme
        themeOptions.forEach(btn => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('ring-2', 'ring-white', 'ring-opacity-60');
            } else {
                btn.classList.remove('ring-2', 'ring-white', 'ring-opacity-60');
            }
        });
        
        // Highlight bubble style
        bubbleStyleOptions.forEach(btn => {
            if (btn.dataset.style === currentBubbleStyle) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Highlight font size
        fontSizeOptions.forEach(btn => {
            if (btn.dataset.size === currentFontSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Suggestion pills
    suggestionPills.forEach(pill => {
        pill.addEventListener('click', function() {
            chatInput.value = this.textContent;
            sendMessage();
        });
    });
    
    // Initialize emoji picker
    function initEmojiPicker() {
        const emojis = [
            '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
            '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗',
            '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐',
            '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐',
            '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝',
            '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲',
            '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭',
            '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱'
        ];
        
        // Clear existing content
        emojiPicker.innerHTML = '';
        
        // Add emojis
        emojis.forEach(emoji => {
            const emojiSpan = document.createElement('div');
            emojiSpan.className = 'emoji-item';
            emojiSpan.textContent = emoji;
            emojiSpan.addEventListener('click', function() {
                chatInput.value += emoji;
                emojiPicker.style.display = 'none';
                chatInput.focus();
            });
            emojiPicker.appendChild(emojiSpan);
        });
    }
    
    // Toggle emoji picker
    emojiButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (emojiPicker.style.display === 'block') {
            emojiPicker.style.display = 'none';
        } else {
            const inputRect = this.getBoundingClientRect();
            emojiPicker.style.display = 'block';
            emojiPicker.style.top = (inputRect.top - 220) + 'px';
            emojiPicker.style.left = inputRect.left + 'px';
        }
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', function() {
        emojiPicker.style.display = 'none';
    });
    
    // Prevent click inside emoji picker from closing it
    emojiPicker.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Scroll down button functionality
    scrollDownButton.addEventListener('click', function() {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    });

    // Scroll up button functionality
    scrollUpButton.addEventListener('click', function() {
        chatMessages.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Load chat history from localStorage
    function loadChatHistory() {
        const storedHistory = JSON.parse(localStorage.getItem('chatHistory'));
        if (storedHistory) {
            storedHistory.forEach(entry => {
                if (entry.role === 'user') {
                    addUserMessage(entry.content);
                } else {
                    addBotMessage(entry.content);
                }
            });
        } else {
            setTimeout(() => {
                addBotMessage("👋 Hi there! I'm ChatterBot, your friendly AI assistant. How can I help you today?");
            }, 1000);
        }
    }

    // Save chat history to localStorage
    function saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    // Call loadChatHistory on page load
    window.addEventListener('load', function() {
        loadChatHistory();
        displayRandomSuggestions(); // Display random suggestions
    });

    infoButton.addEventListener('click', function() {
        // Create and show an info modal
        const infoModal = document.createElement('div');
        infoModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        infoModal.id = 'info-modal';
        
        infoModal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">About ChatterBot</h3>
                    <button id="close-info" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="mb-3">ChatterBot is a friendly AI assistant powered by GROQ AI.</p>
                    <p class="mb-3">This interactive chatbot can answer your questions, provide information, and help with various tasks.</p>
                    <p>You can customize the theme using the settings button and enjoy a personalized experience!</p>
                </div>
                
                <div class="mt-6 text-sm text-gray-500">
                    Version 1.0.0 • Made by Haddi FZ
                </div>
            </div>
        `;
        
        document.body.appendChild(infoModal);
        
        // Close info modal functionality
        document.getElementById('close-info').addEventListener('click', function() {
            document.body.removeChild(infoModal);
        });
    });

    function clearChatHistory() {
        // Clear the chat messages from the UI
        chatMessages.innerHTML = '';
        
        // Clear the chat history array
        chatHistory = [];
        
        // Remove chat history from localStorage
        localStorage.removeItem('chatHistory');
    }
    
    // Event listener for the clear history button
    document.getElementById('clear-history-button').addEventListener('click', function() {
        document.getElementById('clear-history-modal').classList.remove('hidden');
    });
    
    // Confirm clear history
    document.getElementById('confirm-clear-history').addEventListener('click', function() {
        clearChatHistory();
        document.getElementById('clear-history-modal').classList.add('hidden');
        addBotMessage("🗑️ Chat history cleared!");
        addBotMessage("👋 Hi there! I'm ChatterBot, your friendly AI assistant. How can I help you today?");
    });
    
    // Cancel clear history
    document.getElementById('cancel-clear-history').addEventListener('click', function() {
        document.getElementById('clear-history-modal').classList.add('hidden');
    });
});