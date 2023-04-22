// ----------------- SETUP ----------------- //


// is main function running
let mainFunctionRunning = false;

// listen for screen width changes
window.addEventListener('resize', runMain);

// check if screen width is valid
function isScreenWidthValid() {
    return window.innerWidth >= 1100;
}

// run main function
function runMain() {
    if (isScreenWidthValid() && !mainFunctionRunning) {
        console.log('running main function...')
        mainFunctionRunning = true;
        main();
    } else if (!isScreenWidthValid() && mainFunctionRunning) {
        console.log('removing main function...')
        mainFunctionRunning = false;
        removeMain();
    }
}


// ----------------- MAIN FUNCTION ----------------- //


async function main() {


    // ----------------- CREATE ELEMENTS ----------------- //


    // select chatbox element and its parent
    const chatboxElement = document.querySelector('textarea[tabindex="0"]');
    const chatboxParentElement = chatboxElement.parentNode;

    // select send button
    const sendButton = chatboxParentElement.querySelector('button:nth-child(2)');

    // create necessary elements
    const microphoneButton = document.createElement('button');
    const iconContainer = document.createElement('div');
    const microphoneSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const microphonePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const microphoneAnimation = document.createElement('style');


    // ----------------- SPEECH RECOGNITION ----------------- //


    // check if browser supports Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Speech Recognition API is not supported in this browser.');
        return;
    }

    // create an instance of Speech Recognition API
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // speech recognition state
    let isRecognitionActive = false;


    // ----------------- CREATE BUTTON ----------------- //


    if (chatboxParentElement) {


        // build microphone button
        microphoneButton.setAttribute('class', 'GPT-microphone-button absolute border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] hover:bg-gray-100 dark:hover:bg-gray-900');
        microphoneButton.setAttribute('style', 'right: -60px; bottom: 0; height: 50px; width: 50px; display: flex; align-items: center; justify-content: center; border-width: 1px; margin-bottom: -1px;');

        // build icon container
        iconContainer.setAttribute('class', 'GPT-microphone-icon');
        iconContainer.setAttribute('style', 'position: relative; width: 21px; height: 21px;');

        // build svg element
        microphoneSVG.setAttribute('class', 'GPT-microphone-svg');
        microphoneSVG.setAttribute('width', '21');
        microphoneSVG.setAttribute('height', '21');
        microphoneSVG.setAttribute('viewBox', '0 0 484.5 484.5');
        microphoneSVG.setAttribute('xml:space', 'preserve');

        // build path element
        microphonePath.setAttribute('class', 'GPT-microphone-path');
        microphonePath.setAttribute('fill', '#8e8ea0');
        microphonePath.setAttribute('d', 'M242.25,306c43.35,0,76.5-33.15,76.5-76.5v-153c0-43.35-33.15-76.5-76.5-76.5c-43.35,0-76.5,33.15-76.5,76.5v153C165.75,272.85,198.9,306,242.25,306z M377.4,229.5c0,76.5-63.75,130.05-135.15,130.05c-71.4,0-135.15-53.55-135.15-130.05H63.75c0,86.7,68.85,158.1,153,170.85v84.15h51v-84.15c84.15-12.75,153-84.149,153-170.85H377.4L377.4,229.5z');

        // build animation
        microphoneAnimation.setAttribute('class', 'GPT-microphone-animation');
        microphoneAnimation.innerHTML = `
        .GPT-microphone-active::before {
            content: "";
            display: block;
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #f25c54;
            opacity: 0;
            animation: wave 1.65s infinite;
        }
        @keyframes wave {
            0% {
                transform: scale(.5);
                opacity: 0;
            }
            30% {
                opacity: .5;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;

        // append everything to DOM
        microphoneSVG.appendChild(microphonePath);
        iconContainer.appendChild(microphoneSVG);
        microphoneButton.appendChild(iconContainer);
        chatboxParentElement.appendChild(microphoneButton);
        document.head.appendChild(microphoneAnimation);


        // ----------------- LISTEN TO EVENTS ----------------- //


        // append transcript to chatbox
        recognition.addEventListener('result', (event) => {
            const lastIndex = event.results.length - 1;
            const transcript = event.results[lastIndex][0].transcript;
            // if speech recognition is final, append transcript to chatbox
            if (event.results[lastIndex].isFinal) {
                chatboxElement.value += transcript.trim() + ' ';
                // manually trigger input event
                const inputEvent = new Event('input', { bubbles: true });
                chatboxElement.dispatchEvent(inputEvent);
            }
        });

        // add event listener to microphone button
        microphoneButton.addEventListener('click', (e) => {
            e.preventDefault();
            isRecognitionActive ? turnOff(recognition) : turnOn(recognition);
            isRecognitionActive = !isRecognitionActive;
            chatboxElement.focus();
        });

        // add event listener to chatbox
        chatboxElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                turnOff(recognition);
            }
        });
    }


    // ----------------- HELPER FUNCTIONS ----------------- //


    // turn microphone button on
    function turnOn(recognition) {
        recognition.start();
        microphonePath.setAttribute('fill', '#f25c54');
        iconContainer.classList.add('GPT-microphone-active');
    }

    // turn microphone button off
    async function turnOff(recognition) {
        recognition.stop();
        microphonePath.setAttribute('fill', '#8e8ea0');
        iconContainer.classList.remove('GPT-microphone-active');
        // send message if user has enabled option
        if (await sendMessageOnMicOff()) {
            sendButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }
}


// ----------------- SIDE EFFECTS ----------------- //

// debounce function
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// load sendMessageOnMicOff setting from storage
async function sendMessageOnMicOff() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('sendMessageOnMicOff', (result) => {
            return resolve(result.sendMessageOnMicOff);
        });
    });
}

// initialize observer to re-run main() if microphone button is not present
function initObserver() {
    console.log('Initializing observer...')
    const observer = new MutationObserver(
        debounce((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type === 'childList' &&
                    mutation.addedNodes.length > 0 &&
                    !document.querySelector('.GPT-microphone-button')
                ) {
                    console.log('Re-running main()...');
                    main();
                }
            }
        }, 10)
    );
    observer.observe(document.body, { childList: true, subtree: true });
}

// remove main function
function removeMain() {
    console.log('Removing...');
    const microphoneActive = document.querySelector('.GPT-microphone-active');
    const microphonePath = document.querySelector('.GPT-microphone-path');
    const microphoneSVG = document.querySelector('.GPT-microphone-svg');
    const iconContainer = document.querySelector('.GPT-microphone-icon');
    const microphoneButton = document.querySelector('.GPT-microphone-button');
    const microphoneAnimation = document.querySelector('.GPT-microphone-animation');
    if (microphoneActive) microphoneActive.remove();
    if (microphonePath) microphonePath.remove();
    if (microphoneSVG) microphoneSVG.remove();
    if (iconContainer) iconContainer.remove();
    if (microphoneButton) microphoneButton.remove();
    if (microphoneAnimation) microphoneAnimation.remove();
}


runMain();
initObserver();