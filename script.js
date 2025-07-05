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

    // Image upload related elements
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageButton = document.getElementById('remove-image');
    const uploadProgressModal = document.getElementById('upload-progress-modal');
    const uploadStatusMessage = document.getElementById('upload-status-message');
    
    // Chat history
    let chatHistory = [];
    const MAX_HISTORY_SIZE = 100; // Batasi jumlah pesan untuk mengelola memori
    let isInitialized = false;

    // Theme
    let currentTheme = localStorage.getItem('theme') || 'default';
    let currentBubbleStyle = localStorage.getItem('bubbleStyle') || 'rounded';
    let currentFontSize = localStorage.getItem('fontSize') || 'medium';

    // Current uploaded image ID
    let currentImageId = null;

    // Apply settings from localStorage
    applyTheme(currentTheme);
    applyBubbleStyle(currentBubbleStyle);
    applyFontSize(currentFontSize);

    if (typeof katex === 'undefined') {
        console.warn('KaTeX not loaded yet, LaTeX rendering may be unavailable');
        // Try to load KaTeX dynamically if needed
        loadKaTeX();
    }

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
        const suggestionContainer = document.querySelector('#suggestion-container');
        if (!suggestionContainer) return;
        suggestionContainer.innerHTML = ''; // Clear existing suggestions

        const shuffledSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);

        shuffledSuggestions.forEach(suggestion => {
            const button = document.createElement('button');
            const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            button.className = `suggestion-pill ${randomColor} text-white px-2 py-1 rounded-full text-xs hover:${randomColor} hover:bg-opacity-80 transition-colors`;
            button.textContent = suggestion;
            button.addEventListener('click', function() {
                chatInput.value = suggestion;
                sendMessage();
            });
            suggestionContainer.appendChild(button);
        });
    }

    // Function to dynamically load KaTeX if needed
    function loadKaTeX() {
        if (typeof katex !== 'undefined') return; // Already loaded
        
        // Create and append KaTeX CSS
        const katexCSS = document.createElement('link');
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
        document.head.appendChild(katexCSS);
        
        // Create and append KaTeX JS
        const katexScript = document.createElement('script');
        katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
        katexScript.onload = function() {
            console.log('KaTeX loaded successfully');
        };
        katexScript.onerror = function() {
            console.error('Failed to load KaTeX');
        };
        document.body.appendChild(katexScript);
    }
    
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
    
    // New functions to render messages without adding to history
    function renderUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble user-bubble';
        messageDiv.innerHTML = message.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageDiv);
    }

    function renderBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble bot-bubble';
        messageDiv.innerHTML = processMessageContent(message);
        chatMessages.appendChild(messageDiv);
    }

    // Modified addUserMessage and addBotMessage to only add to history if initialized
    function addUserMessage(message) {
        renderUserMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (isInitialized) {
            chatHistory.push({ role: 'user', content: message });
            trimChatHistory();
            saveChatHistory();
        }
    }

    function addBotMessage(message) {
        renderBotMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (isInitialized) {
            chatHistory.push({ role: 'assistant', content: message });
            trimChatHistory();
            saveChatHistory();
        }
    }

    function addUserMessageWithImage(message, imageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble user-bubble';
    
        let content = '';
        if (message && message.trim() !== '') {
            content += message.replace(/\n/g, '<br>');
            content += '<br>';
        }
        content += `<img src="${imageData}" class="mt-2 rounded-lg max-w-full max-h-48" alt="Uploaded image">`;
    
        messageDiv.innerHTML = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        const combinedContent = message ? `${message} [Image attached]` : '[Image attached]';
        chatHistory.push({ role: 'user', content: combinedContent });
        trimChatHistory(); // Batasi ukuran riwayat
        saveChatHistory();
    }
    
    function processMessageContent(content) {
        // Escape HTML to prevent XSS
        function escapeHTML(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#39;');
        }
    
        // Handle LaTeX expressions - preserve them first
    const mathPlaceholders = {
        display: {},
        inline: {}
    };
    
    let displayMathCounter = 0;
    // Handle display math ($$...$$ and \[...\])
    content = content.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g, (match, dollarMath, bracketMath) => {
        const math = dollarMath || bracketMath;
        const id = `display-math-${displayMathCounter++}`;
        mathPlaceholders.display[id] = math;
        return `DISPLAYMATH_${id}`;
    });
    
    let inlineMathCounter = 0;
    // Handle inline math ($...$ and \(...\))
    content = content.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)|\\\((\s*.*?[^\\]\s*)\\\)/g, (match, singleDollarMath, escapedParenMath) => {
        const math = singleDollarMath || escapedParenMath;
        const id = `inline-math-${inlineMathCounter++}`;
        mathPlaceholders.inline[id] = math;
        return `INLINEMATH_${id}`;
    });

    // Handle code blocks (```...```)
    content = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${escapeHTML(code.trim())}</code></pre>`;
    });

    // Handle inline code (`...`)
    content = content.replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${escapeHTML(code)}</code>`;
    });

    // Handle Markdown links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>');

    // Handle bold
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Handle italic
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Handle newlines
    content = content.replace(/\n/g, '<br>');

    // Restore and render LaTeX expressions
    Object.keys(mathPlaceholders.display).forEach(id => {
        const math = mathPlaceholders.display[id];
        try {
            if (typeof katex !== 'undefined') {
                content = content.replace(`DISPLAYMATH_${id}`, katex.renderToString(math, {
                    displayMode: true,
                    throwOnError: false
                }));
            } else {
                content = content.replace(`DISPLAYMATH_${id}`, 
                    `<div class="text-center bg-gray-100 p-2 my-2 rounded">$${escapeHTML(math)}$</div>`);
            }
        } catch (e) {
            content = content.replace(`DISPLAYMATH_${id}`, 
                `<div class="text-red-500">Error rendering LaTeX: ${escapeHTML(math)}</div>`);
        }
    });

    Object.keys(mathPlaceholders.inline).forEach(id => {
        const math = mathPlaceholders.inline[id];
        try {
            if (typeof katex !== 'undefined') {
                content = content.replace(`INLINEMATH_${id}`, katex.renderToString(math, {
                    displayMode: false,
                    throwOnError: false
                }));
            } else {
                content = content.replace(`INLINEMATH_${id}`, 
                    `<span class="bg-gray-100 px-1 rounded">${escapeHTML(math)}</span>`);
            }
        } catch (e) {
            content = content.replace(`INLINEMATH_${id}`, 
                `<span class="text-red-500">Error rendering LaTeX: ${escapeHTML(math)}</span>`);
        }
    });
    
        return content;
    }
    
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '' && !currentImageId) return;
    
        const hasImage = currentImageId !== null;
        let userContent = message;
        let sentImageId = null;
    
        if (hasImage) {
            sentImageId = currentImageId;
            addUserMessageWithImage(message, imagePreview.src);
        } else {
            addUserMessage(userContent);
        }
    
        chatInput.value = '';
        chatInput.style.height = 'auto';
        if (hasImage) {
            imagePreviewContainer.classList.add('hidden');
            imagePreview.src = '';
            imageUpload.value = '';
            currentImageId = null;
            chatInput.placeholder = "Type your message here...";
        }
    
        showTypingIndicator();
    
        try {
            const language = groqApi.detectLanguage(userContent || 'en');
            const userContext = { language: language };
            const response = await groqApi.generateResponse(
                chatHistory,
                userContext,
                { imageId: sentImageId }
            );
    
            removeTypingIndicator();
            addBotMessage(response);
        } catch (error) {
            removeTypingIndicator();
            addBotMessage(`⚠️ Error: ${error.message}`);
            console.error('API Error:', error);
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = `${this.scrollHeight}px`;
    });

    // Add this near your other event listeners (after the DOMContentLoaded event)

    // Setup clipboard event listener on the chat input
    chatInput.addEventListener('paste', async function(e) {
        // Check if the pasted content has items
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            
            // Look for image content
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    // Prevent default paste behavior for text
                    e.preventDefault();
                    
                    // Get the image file from clipboard
                    const file = items[i].getAsFile();
                    if (!file) continue;
                    
                    try {
                        // Show upload progress
                        uploadProgressModal.classList.remove('hidden');
                        uploadStatusMessage.textContent = 'Processing clipboard image...';
                        
                        // Process the image using your existing API
                        const { imageId, imageData } = await groqApi.processImage(file);
                        currentImageId = imageId;
                        
                        // Display the image preview
                        imagePreview.src = imageData;
                        imagePreviewContainer.classList.remove('hidden');
                        
                        // Hide progress modal and focus input
                        uploadProgressModal.classList.add('hidden');
                        chatInput.focus();
                        chatInput.placeholder = "Ask something about this image...";
                        
                        // Notify the user
                        const notificationDiv = document.createElement('div');
                        notificationDiv.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                        notificationDiv.textContent = '✓ Image pasted from clipboard';
                        document.body.appendChild(notificationDiv);
                        
                        // Remove notification after 3 seconds
                        setTimeout(() => {
                            if (document.body.contains(notificationDiv)) {
                                document.body.removeChild(notificationDiv);
                            }
                        }, 3000);
                        
                    } catch (error) {
                        uploadStatusMessage.textContent = error.message;
                        setTimeout(() => uploadProgressModal.classList.add('hidden'), 2000);
                        console.error('[Clipboard Image Error]', error);
                    }
                    
                    // Only process the first image found
                    break;
                }
            }
        }
    });
    
    settingsButton.addEventListener('click', function() {
        settingsModal.classList.add('active');
        settingsModal.style.display = 'flex';
        highlightCurrentSettings();
    });

    closeSettings.addEventListener('click', function() {
        settingsModal.classList.remove('active');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
    });

    saveSettings.addEventListener('click', function() {
        settingsModal.classList.remove('active');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 300);
        addBotMessage("✅ Settings saved! Your customizations have been applied.");
    });

    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('theme', theme);
            highlightCurrentSettings();
        });
    });

    const bubbleStyleOptions = document.querySelectorAll('.bubble-style-option');
    bubbleStyleOptions.forEach(option => {
        option.addEventListener('click', function() {
            const style = this.dataset.style;
            applyBubbleStyle(style);
            localStorage.setItem('bubbleStyle', style);
            highlightCurrentSettings();
        });
    });

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
        if (theme !== 'default') document.body.classList.add(`theme-${theme}`);
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
    
    suggestionPills.forEach(pill => {
        pill.addEventListener('click', function() {
            chatInput.value = this.textContent;
            sendMessage();
        });
    });
    
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
        
        emojiPicker.innerHTML = '';
        
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
    
    emojiButton.addEventListener('click', function(e) {
        e.stopPropagation();
        emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
        if (emojiPicker.style.display === 'block') {
            const inputRect = this.getBoundingClientRect();
            emojiPicker.style.top = (inputRect.top - 220) + 'px';
            emojiPicker.style.left = inputRect.left + 'px';
        }
    });
    
    document.addEventListener('click', function() {
        emojiPicker.style.display = 'none';
    });
    
    emojiPicker.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    scrollDownButton.addEventListener('click', function() {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    });

    scrollUpButton.addEventListener('click', function() {
        chatMessages.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    function addWelcomeMessage() {
        const welcomeMessage = "👋 Hi there! I'm ChatterBot, your friendly AI assistant. You can ask me questions, share images for analysis, or just chat. How can I help you today?";
        addBotMessage(welcomeMessage);
    }

    function loadChatHistory() {
        // First, completely clear both the UI and the in-memory history
        chatMessages.innerHTML = '';
        chatHistory = [];
        
        // Then load from localStorage
        const storedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        if (storedHistory.length === 0) {
            // Only add welcome message if there's no history
            addWelcomeMessage();
        } else {
            // Process and display stored messages
            chatHistory = storedHistory.map(entry => ({
                role: entry.role,
                content: typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content)
            }));
            
            // Render the messages without adding them to history again
            chatHistory.forEach(entry => {
                if (entry.role === 'user') {
                    if (entry.content.includes('[Image attached]')) {
                        const textContent = entry.content.replace(' [Image attached]', '');
                        renderUserMessage(textContent || 'Image shared');
                    } else {
                        renderUserMessage(entry.content);
                    }
                } else {
                    renderBotMessage(entry.content);
                }
            });
        }
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mark initialization as complete
        isInitialized = true;
    }

    function saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    function trimChatHistory() {
        if (chatHistory.length > MAX_HISTORY_SIZE) {
            chatHistory = chatHistory.slice(-MAX_HISTORY_SIZE);
        }
    }

    // Modified initialization sequence
    window.addEventListener('load', function() {
        // Reset flag on page load
        isInitialized = false;
        
        // Load chat history - this will set isInitialized to true when complete
        loadChatHistory();
        
        // Display random suggestions
        displayRandomSuggestions();
    });

    infoButton.addEventListener('click', function() {
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
                    <p class="mb-3">ChatterBot is a versatile AI assistant powered by GROQ AI, designed to make your conversations engaging and productive.</p>
                    <p class="mb-3">Key features include:</p>
                    <ul class="list-disc pl-5 mb-3">
                        <li>Ask questions and get answers in multiple languages (English, Indonesian, Malay).</li>
                        <li>Upload images for analysis via drag-and-drop or file selection.</li>
                        <li>Render mathematical equations beautifully with LaTeX support.</li>
                        <li>Customize your experience with themes, chat bubble styles, and font sizes.</li>
                        <li>Explore conversation starters with random suggestions.</li>
                        <li>Add fun emojis to your messages with an emoji picker.</li>
                        <li>Persistent chat history that saves up to 100 messages, cleared only when you choose.</li>
                    </ul>
                    <p>Enjoy a seamless and personalized chat experience with ChatterBot!</p>
                </div>
                
                <div class="mt-6 text-sm text-gray-500">
                    Version 1.0.0 • Made by Haddi FZ
                </div>
            </div>
        `;
        
        document.body.appendChild(infoModal);
        
        document.getElementById('close-info').addEventListener('click', function() {
            document.body.removeChild(infoModal);
        });
    });

    function clearChatHistory() {
        chatMessages.innerHTML = '';
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        addWelcomeMessage();
    }
    
    document.getElementById('clear-history-button').addEventListener('click', function() {
        document.getElementById('clear-history-modal').classList.remove('hidden');
    });
    
    document.getElementById('confirm-clear-history').addEventListener('click', function() {
        clearChatHistory();
        document.getElementById('clear-history-modal').classList.add('hidden');
        addBotMessage("🗑️ Chat history cleared!");
    });
    
    document.getElementById('cancel-clear-history').addEventListener('click', function() {
        document.getElementById('clear-history-modal').classList.add('hidden');
    });

    imageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            uploadProgressModal.classList.remove('hidden');
            uploadStatusMessage.textContent = 'Processing image...';
            
            const { imageId, imageData } = await groqApi.processImage(file);
            currentImageId = imageId;
            
            imagePreview.src = imageData;
            imagePreviewContainer.classList.remove('hidden');
            
            uploadProgressModal.classList.add('hidden');
            chatInput.focus();
            chatInput.placeholder = "Ask something about this image...";
        } catch (error) {
            uploadStatusMessage.textContent = error.message;
            setTimeout(() => uploadProgressModal.classList.add('hidden'), 2000);
            console.error('[Image Upload Error]', error);
        }
    });
    
    removeImageButton.addEventListener('click', function() {
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = '';
        imageUpload.value = '';
        currentImageId = null;
        chatInput.placeholder = "Type your message here...";
    });

    const chatContainer = document.querySelector('.bg-white.rounded-3xl');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        chatContainer.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        chatContainer.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        chatContainer.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        chatContainer.classList.add('drag-highlight');
    }
    
    function unhighlight() {
        chatContainer.classList.remove('drag-highlight');
    }
    
    chatContainer.addEventListener('drop', async function(e) {
        preventDefaults(e);
        const file = e.dataTransfer.files[0];
        
        if (file && file.type.startsWith('image/')) {
            try {
                uploadProgressModal.classList.remove('hidden');
                uploadStatusMessage.textContent = 'Processing image...';
                
                const { imageId, imageData } = await groqApi.processImage(file);
                currentImageId = imageId;
                
                imagePreview.src = imageData;
                imagePreviewContainer.classList.remove('hidden');
                
                uploadProgressModal.classList.add('hidden');
                chatInput.focus();
                chatInput.placeholder = "Ask something about this image...";
            } catch (error) {
                uploadStatusMessage.textContent = error.message;
                setTimeout(() => uploadProgressModal.classList.add('hidden'), 2000);
                console.error('[Image Drop Error]', error);
            }
        }
    });
});