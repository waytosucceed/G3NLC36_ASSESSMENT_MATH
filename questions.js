var questions = [];
var i = 0;
var count = 0;
var score = 0;
var Ansgiven = []; // Store answers given by the user
var previousQuestionIndex = null; // Track the previously displayed question
var topicName = ''; // Variable to store the topic name
const submitSound = document.getElementById("submit-sound");

const uniqueKey = "Assessment";

// Helper function to save data in memory (instead of localStorage)
function saveToLocalStorage(key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  storageData[key] = value;
  localStorage.setItem(uniqueKey, JSON.stringify(storageData));
}


// Helper function to get data from local storage under the unique key
function getFromLocalStorage(key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  return storageData[key];
}

fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    // Get the selected topic from the URL
    const urlParams = new URLSearchParams(window.location.search);
    topicName = urlParams.get('topic'); // Store topic name for later use

    // Find the questions for the selected topic
    const selectedTopic = data.topics.find(t => t.heading === topicName);

    if (selectedTopic) {
      questions = selectedTopic.questions; // Access the questions array for the selected topic
      count = questions.length;

      // Store total number of questions in memory
      saveToLocalStorage(topicName + '_totalQuestions', count);

      // Load the heading from the selected topic
      document.getElementById('heading').innerText = topicName || 'Default Heading'; // Set default heading if not provided
      loadButtons();
      loadQuestion(i);

       // Retrieve topics from localStorage using your helper function
      const storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};  // Retrieve full storage data
      const topics = storageData['topics'] || []; // Get topics from storage data

      // Check if the selected topic is already stored to avoid duplicates
      if (!topics.find(t => t.heading === topicName)) {
        topics.push(selectedTopic); // Add the selected topic to the topics array
        storageData['topics'] = topics; // Update storageData with the new topics array
        localStorage.setItem(uniqueKey, JSON.stringify(storageData)); // Save updated storage back to localStorage
      }
    } else {
      document.getElementById('heading').innerText = 'Topic not found';
      document.getElementById('buttonContainer').innerHTML = 'No questions available for this topic.';
    }
  });

function loadButtons() {
  var buttonContainer = document.getElementById("buttonContainer");
  buttonContainer.innerHTML = ""; // Clear previous buttons
  for (var j = 0; j < questions.length; j++) {
    var btn = document.createElement("button");
    btn.className = "btn btn-default smallbtn";
    btn.innerHTML = "Q" + (j + 1);
    btn.setAttribute("onclick", "abc(" + (j + 1) + ")");
    if (getFromLocalStorage(topicName + '_completed')) {
      btn.classList.add("disabled-btn");
      btn.disabled = true;
    }
    buttonContainer.appendChild(btn);
  }
  // Highlight the button for the current question
  highlightButton(i);
  // Update button styles based on answered questions
  updateButtonStyles();
}

let currentSound = null; // Variable to keep track of the currently playing sound

function checkAllInputBoxesAnswered() {
  const allAnswered = questions.every((q, index) => {
    if (!q.inputBox) return true; // Non-input questions are considered "answered"
    
    const userAnswer = Ansgiven[index];
    if (!userAnswer) return false;
    
    // For table structure
    if (q.type === "table") {
      let requiredInputs = 0;
      
      // Count empty operands in all rows (excluding header row)
      Object.keys(q.inputBox).forEach(rowKey => {
        if (rowKey !== 'row1') { // Skip header row
          const row = q.inputBox[rowKey];
          requiredInputs += row.filter(item => item.operand === "").length;
        }
      });
      
      // Check if we have enough non-empty answers
      const filledAnswers = Array.isArray(userAnswer) ? 
        userAnswer.filter(ans => ans && ans.trim() !== "").length : 0;
      
      return filledAnswers >= requiredInputs;
    }
    // For row-based structure, check if we have answers for all required inputs
    else if (q.inputBox.row1 || q.inputBox.row2) {
      let requiredInputs = 0;
      
      // Count required inputs in row1
      if (q.inputBox.row1) {
        requiredInputs += q.inputBox.row1.filter(item => item.operand === "" || item.operator === "").length;
      }
      
      // Count required inputs in row2
      if (q.inputBox.row2) {
        requiredInputs += q.inputBox.row2.filter(item => item.operand === "" || item.operator === "").length;
      }
      
      // Check if we have enough non-empty answers
      const filledAnswers = Array.isArray(userAnswer) ? 
        userAnswer.filter(ans => ans && ans.trim() !== "").length : 0;
      
      return filledAnswers >= requiredInputs;
    } else {
      // Original array-based structure
      return Array.isArray(userAnswer) ? userAnswer.some(ans => ans && ans.trim() !== "") : false;
    }
  });
  
  if (allAnswered) {
    document.getElementById("picdiv").classList.remove("col-md-12", "col-lg-12", "col-sm-12", "col-xs-12");
    document.getElementById("picdiv").classList.add("col-md-7", "col-lg-7", "col-sm-7", "col-xs-7");
  }
}

// In the loadQuestion function, replace the inputBox handling section with this:

function loadQuestion(index) {
  var randomQuestion = questions[index];
  if (!randomQuestion) {
    console.error("No question found at index:", index);
    return;
  }
 
  // Set question text
  var questionElement = document.getElementById("question");
  questionElement.innerHTML = randomQuestion.question;

  // Check if there is a sound associated with the question
  if (randomQuestion.questionSound) {
    var soundButton = document.createElement("button");
    soundButton.className = "btn btn-sound";
    soundButton.innerText = "🔊 Play Sound";
    soundButton.onclick = function() {
      var sound = new Audio(randomQuestion.questionSound);
      sound.play();
    };
    questionElement.appendChild(soundButton);
  }

  // Get the options element
  var optionsElement = document.getElementById("options");
  optionsElement.innerHTML = ""; // Clear existing options

  // Check if question has inputBox (no options)
  if (randomQuestion.inputBox) {
    
    // Special handling for table type questions - keep left-right layout
    if (randomQuestion.type === "table") {
      var mainDiv = document.getElementsByClassName("maindiv")[0];
      if (mainDiv) {
        mainDiv.style.display = 'flex';
      }
      
      // Keep the question on the left side
      document.getElementById("picdiv").classList.remove("col-md-12", "col-lg-12", "col-sm-12", "col-xs-12");
      document.getElementById("picdiv").classList.add("col-md-7", "col-lg-7", "col-sm-7", "col-xs-7");
      document.getElementById("questiondiv").classList.remove("input", "col-md-10", "col-lg-10", "col-sm-10", "col-xs-10");
      document.getElementById("questiondiv").classList.add("col-md-5", "col-lg-5", "col-sm-5", "col-xs-5");
      document.getElementById("picdiv").classList.remove("picdiv");
      document.getElementById("question_background").classList.add("img-responsive");
      document.getElementById("question_background").style.width='100%';
      document.getElementById("question_background").style.height='100%';
      document.getElementById("question").style.top='50%';
      document.getElementById("question").style.left='46%';
      
      // Remove any menu styling that might interfere
      const menu = document.getElementsByTagName("ul");
      if (menu.length > 0) {
        menu[0].style.display = '';
        menu[0].style.fontSize = ''; 
        menu[0].style.textAlign = '';
        menu[0].style.flexDirection = '';
        menu[0].style.justifyContent = '';
        menu[0].style.gap = '';
      }
    } else {
      // For non-table input questions - use full width layout
      document.getElementById("picdiv").classList.add("picdiv");
      document.getElementById("picdiv").classList.remove("col-md-7", "col-lg-7", "col-sm-7", "col-xs-7");
      document.getElementById("picdiv").classList.add("col-md-12", "col-lg-12", "col-sm-12", "col-xs-12");
      document.getElementById("questiondiv").classList.add("input");
      document.getElementById("questiondiv").classList.remove("col-md-5", "col-lg-5", "col-sm-5", "col-xs-5");
      document.getElementById("questiondiv").classList.add("col-md-10", "col-lg-10", "col-sm-10", "col-xs-10");
      document.getElementById("question_background").classList.remove("img-responsive");
      document.getElementById("question_background").style.width='100%';
      document.getElementById("question_background").style.height='90%';
      document.getElementById("question_background").style.height='28em';
      document.getElementById("question").style.top='35%';
      document.getElementById("question").style.left='50%';
      document.querySelector(".input").style.top='73%';
      
      const menu = document.getElementsByTagName("ul");
      if (menu.length > 0) {
        menu[0].style.display = 'flex';
        menu[0].style.fontSize= '2.4vw'; 
        menu[0].style.textAlign= 'center';
        menu[0].style.flexDirection= 'column';
        menu[0].style.justifyContent = 'center';
        menu[0].style.gap= '2%';
      }
    }

    // Handle table type questions
    if (randomQuestion.type === "table") {
      // Add heading if it exists
      if (randomQuestion.heading) {
        var headingDiv = document.createElement("div");
        headingDiv.style.fontSize = "24px";
        headingDiv.style.fontWeight = "bold";
        headingDiv.style.textAlign = "center";
        headingDiv.style.marginBottom = "20px";
        headingDiv.style.color = "#333";
        headingDiv.textContent = randomQuestion.heading;
        optionsElement.appendChild(headingDiv);
      }

      // Create table
      var table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.margin = "0 auto";
      table.style.backgroundColor = "white";
      table.style.border = "2px solid #333";

      var inputIndex = 0;
      var rowKeys = Object.keys(randomQuestion.inputBox).sort(); // Sort to ensure correct order

      rowKeys.forEach((rowKey, rowIndex) => {
        var row = randomQuestion.inputBox[rowKey];
        var tr = document.createElement("tr");

        row.forEach((item, cellIndex) => {
          var cell;
          
          // First row is header
          if (rowIndex === 0) {
            cell = document.createElement("th");
            cell.style.backgroundColor = "#D4AF37"; // Gold color for header
            cell.style.fontWeight = "bold";
          } else {
            cell = document.createElement("td");
            cell.style.backgroundColor = rowIndex % 2 === 1 ? "#F5E6A3" : "#E8D66A"; // Alternating colors
          }

          cell.style.border = "2px solid #333";
          cell.style.padding = "15px 20px";
          cell.style.textAlign = "center";
          cell.style.fontSize = "18px";
          cell.style.minWidth = "120px";

          if (item.operand !== "") {
            // Display the text/number
            cell.textContent = item.operand;
          } else {
            // Create input field for empty operands
            var input = document.createElement("input");
            input.type = "text";
            input.className = "answer-input table-input";
            input.style.width = "80px";
            input.style.padding = "8px";
            input.style.fontSize = "16px";
            input.style.textAlign = "center";
            input.style.border = "2px solid #666";
            input.style.borderRadius = "4px";
            input.style.backgroundColor = "#fff";
            
            // Set saved value if exists
            input.value = Ansgiven[i] && Ansgiven[i][inputIndex] ? Ansgiven[i][inputIndex] : "";
            
            input.oninput = function() {
              handleAnswerChange();
              checkAllInputBoxesAnswered();
            };
            
            cell.appendChild(input);
            inputIndex++;
          }

          tr.appendChild(cell);
        });

        table.appendChild(tr);
      });

      optionsElement.appendChild(table);
    }
    // Check if inputBox has row structure (row1, row2) or array structure
    else if (randomQuestion.inputBox.row1 || randomQuestion.inputBox.row2) {
      // Handle row-based structure
      var inputIndex = 0;
      
      // Process row1 if it exists
      if (randomQuestion.inputBox.row1) {
        var row1Div = document.createElement("div");
        row1Div.className = "input-row";
        row1Div.style.display = "flex";
        row1Div.style.alignItems = "center";
        row1Div.style.justifyContent = "center";
        row1Div.style.marginBottom = "10px";
        row1Div.style.gap = "10px";
        
        randomQuestion.inputBox.row1.forEach((item) => {
          // Display prefilled operand if it exists
          if (item.operand && item.operand !== "") {
            var operandSpan = document.createElement("span");
            operandSpan.textContent = item.operand;
            operandSpan.style.fontSize = "3rem";
            operandSpan.style.fontWeight = "bold";
            operandSpan.style.margin = "0 5px";
            row1Div.appendChild(operandSpan);
          }
          
          // Display prefilled operator if it exists
          if (item.operator && item.operator !== "") {
            var operatorSpan = document.createElement("span");
            operatorSpan.textContent = item.operator;
            operatorSpan.style.fontSize = "18px";
            operatorSpan.style.fontWeight = "bold";
            operatorSpan.style.margin = "0 5px";
            row1Div.appendChild(operatorSpan);
          }
          
          // Create input field if either operand or operator is empty
          if (item.operand === "" || item.operator === "") {
            var input = document.createElement("input");
            input.type = "text";
            input.className = "answer-input";
            input.placeholder = "";
            input.value = Ansgiven[i] && Ansgiven[i][inputIndex] ? Ansgiven[i][inputIndex] : "";
            input.oninput = function() {
              handleAnswerChange();
              checkAllInputBoxesAnswered();
            };
            row1Div.appendChild(input);
            inputIndex++;
          }
        });
        optionsElement.appendChild(row1Div);
      }
      
      // Process row2 if it exists
      if (randomQuestion.inputBox.row2) {
        var row2Div = document.createElement("div");
        row2Div.className = "input-row";
        row2Div.style.display = "flex";
        row2Div.style.alignItems = "center";
        row2Div.style.justifyContent = "center";
        row2Div.style.marginBottom = "10px";
        row2Div.style.gap = "10px";
        
        randomQuestion.inputBox.row2.forEach((item) => {
          // Display prefilled operand if it exists
          if (item.operand && item.operand !== "") {
            var operandSpan = document.createElement("span");
            operandSpan.textContent = item.operand;
            operandSpan.style.fontSize = "3rem";
            operandSpan.style.fontWeight = "bold";
            operandSpan.style.margin = "0 5px";
            row2Div.appendChild(operandSpan);
          }
          
          // Display prefilled operator if it exists
          if (item.operator && item.operator !== "") {
            var operatorSpan = document.createElement("span");
            operatorSpan.textContent = item.operator;
            operatorSpan.style.fontSize = "18px";
            operatorSpan.style.fontWeight = "bold";
            operatorSpan.style.margin = "0 5px";
            row2Div.appendChild(operatorSpan);
          }
          
          // Create input field if either operand or operator is empty
          if (item.operand === "" || item.operator === "") {
            var input = document.createElement("input");
            input.type = "text";
            input.className = "answer-input";
            input.placeholder = "";
            input.value = Ansgiven[i] && Ansgiven[i][inputIndex] ? Ansgiven[i][inputIndex] : "";
            input.oninput = function() {
              handleAnswerChange();
              checkAllInputBoxesAnswered();
            };
            row2Div.appendChild(input);
            inputIndex++;
          }
        });
        optionsElement.appendChild(row2Div);
      }
    } else {
      // Handle array-based structure (original code)
      randomQuestion.inputBox.forEach((item, idx) => {
        if (item.operand === "" || item.operator === "") {
          var input = document.createElement("input");
          input.type = "text";
          input.className = "answer-input";
          input.placeholder = "";
          input.value = Ansgiven[i] && Ansgiven[i][idx] ? Ansgiven[i][idx] : "";
          input.oninput = function() {
            handleAnswerChange();
            checkAllInputBoxesAnswered();
          };
          optionsElement.appendChild(input);
        } else {
          var textNode = document.createTextNode(item.operand || item.operator);
          optionsElement.appendChild(textNode);
        }
      });
    }
  }
  else if (randomQuestion.options) {
    var mainDiv = document.getElementsByClassName("maindiv")[0];

    if (mainDiv) {
        mainDiv.style.display = 'flex';
    } else {
        console.error('No element with class "maindiv" found');
    }
    document.getElementById("picdiv").classList.add("col-md-7");
    document.getElementById("picdiv").classList.add("col-lg-7");
    document.getElementById("picdiv").classList.add("col-sm-7");
    document.getElementById("picdiv").classList.add("col-xs-7");
    document.getElementById("questiondiv").classList.remove("input");
    document.getElementById("questiondiv").classList.add("col-md-5");
    document.getElementById("questiondiv").classList.add("col-lg-5");
    document.getElementById("questiondiv").classList.add("col-sm-5");
    document.getElementById("questiondiv").classList.add("col-xs-5");
    document.getElementById("questiondiv").classList.remove("col-md-10");
    document.getElementById("questiondiv").classList.remove("col-lg-10");
    document.getElementById("questiondiv").classList.remove("col-sm-10");
    document.getElementById("questiondiv").classList.remove("col-xs-10");
    document.getElementById("picdiv").classList.remove("picdiv");
    document.getElementById("question_background").classList.add("img-responsive");
    document.getElementById("question_background").style.width='100%';
    document.getElementById("question_background").style.height='100%';
    document.getElementById("question").style.top='50%';
    document.getElementById("question").style.left='46%';
    
    // Display options if they exist
    var hasImageOptions = randomQuestion.options.some(option => option.image);
    var hasTextOnlyOptions = randomQuestion.options.every(option => !option.image);

    if (hasImageOptions) {
      optionsElement.classList.add("grid-layout");
      optionsElement.style.display = "grid";
      optionsElement.style.gap = "2px";
    } else if (hasTextOnlyOptions) {
      optionsElement.classList.add("text-only");
      optionsElement.style.display="block";
    }

    var selectedLi = null;
    randomQuestion.options.forEach(function(option, idx) {
      var li = document.createElement("li");
      li.classList.add("option-container");
      
      li.onclick = function() {
        if (selectedLi) {
          selectedLi.style.border = "";
          selectedLi.style.background = "none";
        }
        li.style.border = "3px solid";
        li.style.borderRadius = "8px";
        li.style.background = "#E2BFD9";
        selectedLi = li;
        handleAnswerChange();
      };

      var radioButton = document.createElement("input");
      radioButton.type = "radio";
      radioButton.name = "answer";
      radioButton.value = idx;
      radioButton.style.display = "none";

      if (option.image) {
        var optionImage = document.createElement("img");
        optionImage.src = option.image;
        optionImage.alt = "Option Image";
        optionImage.style.width = "85%";
        optionImage.style.cursor = "pointer";
        optionImage.style.borderRadius = "12px";

        optionImage.onclick = function() {
          radioButton.checked = true;
          handleAnswerChange();
        };
        li.appendChild(optionImage);
      } else {
        document.getElementById("questiondiv").classList.remove("input");
        var optionTextButton = document.createElement("button");
        optionTextButton.className = "btnOption btn btn-option";
        optionTextButton.innerHTML = option.text;
        optionTextButton.onclick = function() {
          radioButton.checked = true;
          handleAnswerChange();
        };
        li.appendChild(optionTextButton);
      }

      li.appendChild(radioButton);
      optionsElement.appendChild(li);
    });
  }

  // Restore previously selected answer if it exists
  var previouslySelected = Ansgiven[index];
  if (previouslySelected !== null && previouslySelected !== undefined) {
    var previouslySelectedElement = optionsElement.querySelector('input[name="answer"][value="' + previouslySelected + '"]');
    if (previouslySelectedElement) {
      previouslySelectedElement.checked = true;

      var previouslySelectedLi = previouslySelectedElement.closest('li');
      if (previouslySelectedLi) {
        previouslySelectedLi.style.border = "3px solid";
        previouslySelectedLi.style.borderRadius = "8px";
        selectedLi = previouslySelectedLi;
      }
    }
  }

  // Update button visibility and styles
  updateButtonVisibility();
  highlightButton(index);
  updateButtonStyles();
  updateButtonText();
}

function playOptionSound(option) {
  var sound = new Audio(option);
  sound.play();
}

function playSound(soundFile) {
  var audio = new Audio(soundFile);
  audio.play();
}

// Save the answer for the current question
function saveCurrentAnswer() {
  // Get multiple-choice selected answer
  var selectedAnswer = document.querySelector('input[name="answer"]:checked');

  // Check if it's a multiple-choice question
  if (selectedAnswer) {
    Ansgiven[i] = parseInt(selectedAnswer.value); // Store answer as an index
  } else {
    // For questions with input boxes, collect values from all inputs
    var inputFields = document.querySelectorAll('.input-box.editable, .answer-input');
    if (inputFields.length > 0) {
      // Create an array to store input values for the CURRENT question only
      var inputValues = Array.from(inputFields).map(input => input.value.trim());
      
      // Check if all input fields are empty
      var allEmpty = inputValues.every(value => value === "");

      if (allEmpty) {
        Ansgiven[i] = null; // Mark as not answered
      } else {
        // Save all input values for THIS question only
        Ansgiven[i] = inputValues;
      }
    } else {
      Ansgiven[i] = null; // Mark as not answered if neither options nor inputs are present
    }
  }

  saveToLocalStorage('Ansgiven', Ansgiven); // Save the updated answers array to memory
  updateButtonStyles(); // Ensure that button style is updated after submitting
}

function handleAnswerChange() {
  // Show the Submit Answer button and hide the Next button when an answer is selected
  document.getElementById("subbtn").style.display = "inline-block";
  document.getElementById("nextbtn").style.display = "none";
}

function newques() {
  // Save the answer for the current question
  saveCurrentAnswer();

  if (i === count - 1) {
    // Display results
    displayResults();
    // Hide buttonContainer
    document.getElementById("buttonContainer").style.display = "none";
    document.getElementById("questiondiv").style.padding = "3rem";
    document.getElementById("questiondiv").style.backgroundColor = "#8FD8D2";
  } else {
    // Move to the next question
    i++;
    loadQuestion(i);
    document.getElementById("result").innerHTML = "";
    document.getElementById("subbtn").style.display = "inline-block";
    document.getElementById("nextbtn").style.display = "none";
    
    // Update button visibility and styles
    updateButtonVisibility();
    updateButtonStyles();
  }
}

function displayResults() {
  // Calculate the score based on saved answers
  score = 0; // Reset score
  console.log("Starting score calculation. Questions:", questions.length);
  
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const userAnswer = Ansgiven[index];
    const correctAnswer = question.answer;
    
    console.log(`Question ${index + 1}:`, question.question);
    console.log("User answer:", userAnswer);
    console.log("Correct answer:", correctAnswer);
    
    if (userAnswer === undefined || userAnswer === null) {
      console.log("Skipping unanswered question");
      continue; // Skip unanswered questions
    }
    
    if (question.options) {
      // Multiple-choice question
      if (userAnswer === correctAnswer) {
        console.log("Multiple choice correct!");
        score += 1;
      } else {
        console.log("Multiple choice incorrect");
      }
    } else if (question.inputBox) {
      // Input box question (including area model)
      
      // Handle both single input and multiple input cases
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        // Multiple input case
        console.log("Checking multiple inputs");
        let allCorrect = true;
        
        // Compare each input with its corresponding correct answer
        for (let i = 0; i < Math.min(userAnswer.length, correctAnswer.length); i++) {
          // Normalize answers for comparison (trim whitespace and convert to strings)
          const normalizedUserAnswer = String(userAnswer[i] || "").trim();
          const normalizedCorrectAnswer = String(correctAnswer[i] || "").trim();
          
          console.log(`Input ${i + 1}: User="${normalizedUserAnswer}", Correct="${normalizedCorrectAnswer}"`);
          
          // Compare normalized answers
          if (normalizedUserAnswer !== normalizedCorrectAnswer) {
            allCorrect = false;
            console.log(`Input ${i + 1} is incorrect`);
            break;
          }
        }
        
        // Additional check for length mismatch
        if (userAnswer.length !== correctAnswer.length) {
          allCorrect = false;
          console.log("Input count mismatch");
        }
        
        // Award points if all inputs are correct
        if (allCorrect) {
          console.log("All inputs correct! +1 point");
          score += 1;
        }
      } else {
        // Single input case
        const normalizedUserAnswer = String(userAnswer).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();
        
        console.log(`Single input: User="${normalizedUserAnswer}", Correct="${normalizedCorrectAnswer}"`);
        
        if (normalizedUserAnswer === normalizedCorrectAnswer) {
          console.log("Single input correct! +1 point");
          score += 1;
        } else {
          console.log("Single input incorrect");
        }
      }
    }
  }

  console.log("Final score:", score);

  // Save score and completion status to memory storage (instead of localStorage)
  saveToLocalStorage(topicName + '_score', score);
  saveToLocalStorage(topicName + '_completed', 'true'); // Mark topic as completed

  // Hide certain elements
  document.getElementById("question_background").style.display = "none";
  document.getElementById("question").style.display = "none";
  document.getElementById("nextbtn").style.display = "none";
  document.getElementById("result").style.display = "none";
  document.getElementById("options").style.display = "none";
  document.getElementById("head").innerHTML = "Check Your Answers";

  // Calculate percentage and feedback message
  var percentage = (score / questions.length) * 100;
  var progressBarColor = "";
  var feedbackMessage = "";
  if (percentage <= 40) {
    progressBarColor = "#F28D8D"; /* Dark Pastel Red */
    feedbackMessage = "You may need more practice.";
  } else if (percentage > 40 && percentage <= 70) {
    progressBarColor = "#6C8EBF"; /* Dark Pastel Blue */
    feedbackMessage = "Well done!";
  } else if (percentage > 70) {
    progressBarColor = "#B5E7A0"; /* Dark Pastel Green */
    feedbackMessage = "Excellent job!";
  }

  // Set up feedback section
  var mainDiv = document.getElementsByClassName("maindiv")[0];

  if (mainDiv) {
    mainDiv.style.display = 'flex';
  } else {
    console.error('No element with class "maindiv" found');
  }
  
  document.getElementById("picdiv").classList.remove("col-md-12");
  document.getElementById("picdiv").classList.remove("col-lg-12");
  document.getElementById("picdiv").classList.remove("col-sm-12");
  document.getElementById("picdiv").classList.remove("col-xs-12");
  document.getElementById("picdiv").classList.add("col-md-7");
  document.getElementById("picdiv").classList.add("col-lg-7");
  document.getElementById("picdiv").classList.add("col-sm-7");
  document.getElementById("picdiv").classList.add("col-xs-7");
  document.getElementById("picdiv").style.backgroundColor = "#B7A0D0"; /* Dark Pastel Lavender */
  document.getElementById("picdiv").style.fontSize = "1.8rem"; /* Larger font size for feedback */
  document.getElementById("picdiv").style.textAlign = "center";
  document.getElementById("picdiv").style.color = "#333"; /* Darker color for text */

  var Dis = "<br><br><br><br><br><br><br>Score: " + score + "/" + questions.length + "<br><br>";
  var home = "<a href='index.html'><b class='btn btn-success next-btn-progress'>Next</b></a><br>";
  var content = Dis + feedbackMessage + "<br><div class='progress'> <div class='progress-bar' role='progressbar' aria-valuenow='" + percentage + "' aria-valuemin='0' aria-valuemax='100' style='width:" + percentage + "%;background-color:" + progressBarColor + ";'> </div></div>" + home;

  // Store the results content in memory storage with a unique key (instead of localStorage)
  saveToLocalStorage(topicName + '_results_content', content);

  // Prepare question and answer details
  var questionContent = "";
  document.getElementById("questiondiv").classList.remove("input");
  document.getElementById("questiondiv").style.textAlign = "left";
  document.getElementById("questiondiv").style.color = "black";
  document.getElementById("questiondiv").style.fontSize = "18px";
  document.getElementById("questiondiv").innerHTML = ""; // Clear previous content

  for (var j = 0; j < questions.length; j++) {
    var questionObj = questions[j];
    var ques = questionObj.question;
    var userAns = Ansgiven[j];
    var correctAns = questionObj.answer;
    var num = j + 1;
    
    questionContent += "Q." + num + " " + ques + "<br>";
    
    // Display answers based on question type
    if (questionObj.options) {
      // Multiple-choice question
      var correctAnswerText = questionObj.options[correctAns].image ? 
        "<img src='" + questionObj.options[correctAns].image + "' alt='Correct Answer Image' style='width:100px;height:auto;'/>" : 
        questionObj.options[correctAns].text;
      
      var givenAnswerText = userAns !== undefined && userAns !== null ? 
        (questionObj.options[userAns].image ? 
          "<img src='" + questionObj.options[userAns].image + "' alt='Given Answer Image' style='width:100px;height:auto;'/>" : 
          questionObj.options[userAns].text) : 
        "Not Answered";
      
      // Mark incorrect answers
      var isCorrect = userAns === correctAns;
      if (!isCorrect) {
        givenAnswerText = "<span style='color: red;'>" + givenAnswerText + "</span>";
      }
      
      questionContent += "Correct Answer: " + correctAnswerText + "<br>" + 
                         "Answer Given: " + givenAnswerText + "<br><br>";
    } 
    else if (questionObj.inputBox) {
      // Input box question (including area model)
      questionContent += "Correct Answer(s): ";
      
      // Display all correct answers
      if (Array.isArray(correctAns)) {
        questionContent += correctAns.join(", ");
      } else {
        questionContent += correctAns;
      }
      
      questionContent += "<br>Answer Given: ";
      
      // Display user answers
      if (Array.isArray(userAns) && userAns.length > 0) {
        let formattedAnswers = [];
        
        for (let k = 0; k < userAns.length; k++) {
          const userValue = userAns[k] || "__";
          const correctValue = Array.isArray(correctAns) && k < correctAns.length ? correctAns[k] : null;
          
          // Mark incorrect answers in red
          if (correctValue && String(userValue).trim() !== String(correctValue).trim()) {
            formattedAnswers.push("<span style='color: red;'>" + userValue + "</span>");
          } else {
            formattedAnswers.push(userValue);
          }
        }
        
        questionContent += formattedAnswers.join(", ");
      } else {
        questionContent += "<span style='color: red;'>Not Answered</span>";
      }
      
      questionContent += "<br><br>";
    }
  }

  // Store the question content in memory storage with a unique key (instead of localStorage)
  saveToLocalStorage(topicName + '_question_content', questionContent);

  // Display results
  document.getElementById("picdiv").innerHTML = content;
  document.getElementById("questiondiv").innerHTML = questionContent + home;
}

function checkAnswer() {
  submitSound.play();

  // Save the answer for the current question
  saveCurrentAnswer();
  
  // Hide submit button and show next button
  document.getElementById("subbtn").style.display = "none";
  document.getElementById("nextbtn").style.display = "inline-block";

  // Update the button styles to mark this question as answered
  updateButtonStyles();
}


function abc(x) {
  // Save the current answer before changing questions
  saveCurrentAnswer();
  i = x - 1;
  loadQuestion(i);
  document.getElementById("result").innerHTML = "";
  document.getElementById("subbtn").style.display = "inline-block";
  document.getElementById("nextbtn").style.display = "none";

  // Update button styles and visibility
  highlightButton(i);
  updateButtonStyles();
}


function updateButtonVisibility() {
  var selectedAnswer = document.querySelector('input[name="answer"]:checked');
  var textAreaAnswer = document.getElementById("answerTextArea");
  
  if (selectedAnswer || (textAreaAnswer && textAreaAnswer.value.trim() !== "")) {
    document.getElementById("subbtn").style.display = "inline-block";
    document.getElementById("nextbtn").style.display = "none";
  } else {
    document.getElementById("subbtn").style.display = "none";
    document.getElementById("nextbtn").style.display = "inline-block";
  }
}

function highlightButton(index) {
  var buttonContainer = document.getElementById("buttonContainer");
  var buttons = buttonContainer.getElementsByTagName("button");

  // Remove highlight from all buttons
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove("highlighted-btn");
  }

  // Add highlight to the current button
  if (index >= 0 && index < buttons.length) {
    buttons[index].classList.add("highlighted-btn");
  }
}

function updateButtonStyles() {
  var buttonContainer = document.getElementById("buttonContainer");
  var buttons = buttonContainer.getElementsByTagName("button");

  // Remove "answered-btn" class from all buttons
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove("answered-btn");
  }

  // Add "answered-btn" class for answered questions
  Ansgiven.forEach((answer, index) => {
    if (answer !== null && answer !== undefined) {
      // For array answers (input boxes), check if at least one input has a value
      if (Array.isArray(answer)) {
        const hasAnswer = answer.some(value => value && value.trim() !== '');
        if (hasAnswer && index < buttons.length) {
          buttons[index].classList.add("answered-btn");
        }
      } 
      // For multiple choice answers
      else if (index < buttons.length) {
        buttons[index].classList.add("answered-btn");
      }
    }
  });
}


function updateButtonText() {
  var nextButton = document.getElementById("nextbtn");
  if (i === count - 1) {
    nextButton.innerHTML = "FINISH TEST";
    nextButton.onclick = function() {
      newques(); // Calls newques which will hide buttonContainer
    };
  } else {
    nextButton.innerHTML = "Next";
   
  }
}


