// Function to show the popout menu
function show() {
  let showPop = document.getElementById("popout-menu");
  showPop.style.visibility = "visible";
}
// Function to close the popout menu
function closePop() {
  let showPop = document.getElementById("popout-menu");
  showPop.style.visibility = "hidden";
}
// Function to toggle the chat window
function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  const chatIcon = document.querySelector('.chat-icon');
  
  if (chatWindow.style.display === 'block') {
      chatWindow.style.display = 'none';
      chatIcon.style.display = 'flex';
  } else {
      chatWindow.style.display = 'block';
      chatIcon.style.display = 'none';
  }
}
// Function to send a message
function sendMessage() {
  const input = document.getElementById('userInput');
  const messages = document.getElementById('chatMessages');
  
  if (input.value.trim()) {
     
      messages.innerHTML += `
          <div class="chat-message user-message">
              ${input.value}
          </div>
      `;
      
     
      input.value = '';
      
      
      messages.innerHTML += `
          <div class="chat-message bot-message">
              Thanks for your question! We'll respond soon.
          </div>
      `;
      
      // Scroll to bottom
      messages.scrollTop = messages.scrollHeight;
  }
}

// Audio replay logic
let currentAudio = null;

// Add navigation menu toggle for mobile
document.addEventListener("DOMContentLoaded", function() {
  const showBtn = document.getElementById("show-btn");
  const closeBtn = document.querySelector(".popout-menu-btn-close");
  if (showBtn) showBtn.addEventListener("click", function(e){ e.preventDefault(); show(); });
  if (closeBtn) closeBtn.addEventListener("click", function(e){ e.preventDefault(); closePop(); });

  // Chat icon and close button
  const chatIcon = document.querySelector('.chat-icon');
  const chatClose = document.querySelector('.chat-close');
  if (chatIcon) chatIcon.addEventListener("click", toggleChat);
  if (chatClose) chatClose.addEventListener("click", toggleChat);

  // Chat send button
  const chatSend = document.querySelector('.chat-send');
  if (chatSend) chatSend.addEventListener("click", sendMessage);

  // Enter key to send chat
  const userInput = document.getElementById('userInput');
  if (userInput) {
    userInput.addEventListener("keydown", function(event){
      if (event.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Vocabulary card audio
  document.querySelectorAll('.vocabulary-card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      // Prevent double-playing if a link is inside the card
      if (e.target.closest('a')) return;
      const audioSrc = card.getAttribute('data-audio');
      if (audioSrc) {
        // Stop previous audio if playing
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        currentAudio = new Audio(audioSrc);
        currentAudio.play();
      }
    });
    // Optional: allow keyboard accessibility
    card.addEventListener('keydown', function(e) {
      if (e.key === "Enter" || e.key === " ") {
        card.click();
      }
    });
  });
  document.querySelectorAll('.formation-example').forEach(function(card) {
    card.addEventListener('click', function(e) {
      // Prevent double-playing if a link is inside the card
      if (e.target.closest('a')) return;
      const audioSrc = card.getAttribute('data-audio');
      if (audioSrc) {
        // Stop previous audio if playing
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        currentAudio = new Audio(audioSrc);
        currentAudio.play();
      }
    });
    // Optional: allow keyboard accessibility
    card.addEventListener('keydown', function(e) {
      if (e.key === "Enter" || e.key === " ") {
        card.click();
      }
    });
  });
});

// Beginner page modal logic
document.addEventListener("DOMContentLoaded", function() {
  // beginner.html
  const beginnerGameBtn = document.getElementById("beginnerGameBtn");
  const beginnerDifficultyModal = document.getElementById("beginnerDifficultyModal");
  if (beginnerGameBtn && beginnerDifficultyModal) {
    beginnerGameBtn.addEventListener('click', function() {
      beginnerDifficultyModal.style.display = "flex";
    });
    beginnerDifficultyModal.querySelector('.difficulty-modal-close').addEventListener('click', function() {
      beginnerDifficultyModal.style.display = "none";
    });
    // Optional: close modal when clicking outside content
    beginnerDifficultyModal.addEventListener('click', function(e){
      if(e.target === beginnerDifficultyModal) beginnerDifficultyModal.style.display = "none";
    });
  }
  // index.html
  const indexGameBtn = document.getElementById("indexGameBtn");
  const indexDifficultyModal = document.getElementById("indexDifficultyModal");
  if (indexGameBtn && indexDifficultyModal) {
    indexGameBtn.addEventListener('click', function() {
      indexDifficultyModal.style.display = "flex";
    });
    indexDifficultyModal.querySelector('.difficulty-modal-close').addEventListener('click', function() {
      indexDifficultyModal.style.display = "none";
    });
    indexDifficultyModal.addEventListener('click', function(e){
      if(e.target === indexDifficultyModal) indexDifficultyModal.style.display = "none";
    });
  }
});
document.getElementById('quiz-submit').onclick = function() {
  var score = 0;
  var total = 5;
  var resultDiv = document.getElementById('quiz-result');
  var form = document.getElementById('korean-quiz');
  var questions = form.querySelectorAll('.quiz-question');
  for (var i = 0; i < questions.length; ++i) {
    var correct = questions[i].getAttribute('data-answer');
    var radios = questions[i].querySelectorAll('input[type=radio]');
    var answered = false;
    for (var r = 0; r < radios.length; ++r) {
      if (radios[r].checked) {
        answered = true;
        if (radios[r].value === correct) score++;
      }
      // Highlight user's selection, show red for wrong, green for correct
      radios[r].parentNode.style.color = "";
      if (radios[r].checked) {
        if (radios[r].value === correct) {
          radios[r].parentNode.style.color = "green";
        } else {
          radios[r].parentNode.style.color = "red";
        }
      }
    }
    // Show correct answer after submit
    questions[i].querySelector('.correct-answer').style.display = "block";
  }
  var msg = "";
  if (score === total) {
    msg = "Perfect! You got all " + score + " correct!";
  } else {
    msg = "You got " + score + " out of " + total + " correct. Try again!";
  }
  resultDiv.textContent = msg;
};

document.getElementById('quiz-reset').onclick = function() {
  var form = document.getElementById('korean-quiz');
  var radios = form.querySelectorAll('input[type=radio]');
  for (var r = 0; r < radios.length; ++r) {
    radios[r].checked = false;
    radios[r].parentNode.style.color = "";
  }
  var questions = form.querySelectorAll('.quiz-question');
  for (var i = 0; i < questions.length; ++i) {
    questions[i].querySelector('.correct-answer').style.display = "none";
  }
  document.getElementById('quiz-result').textContent = "";
};