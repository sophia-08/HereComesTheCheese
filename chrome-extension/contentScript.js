// Create a button to toggle the DOM display
const domButton = document.createElement('button');
domButton.textContent = 'Show/Hide DOM';
domButton.style.position = 'fixed';
domButton.style.top = '10px';
domButton.style.right = '10px';
domButton.style.zIndex = '10000';
document.body.appendChild(domButton);

// Create a button to show input elements
const inputButton = document.createElement('button');
inputButton.textContent = 'Show Input Elements';
inputButton.style.position = 'fixed';
inputButton.style.top = '40px';
inputButton.style.right = '10px';
inputButton.style.zIndex = '10000';
document.body.appendChild(inputButton);

// Create a container for the DOM text
const domContainer = document.createElement('div');
domContainer.style.position = 'fixed';
domContainer.style.right = '0';
domContainer.style.top = '0';
domContainer.style.bottom = '0';
domContainer.style.width = '50%';
domContainer.style.backgroundColor = 'white';
domContainer.style.overflow = 'auto';
domContainer.style.zIndex = '9999';
domContainer.style.display = 'none';
document.body.appendChild(domContainer);

// Create a divider
const divider = document.createElement('div');
divider.style.position = 'fixed';
divider.style.left = '50%';
divider.style.top = '0';
divider.style.bottom = '0';
divider.style.width = '4px';
divider.style.backgroundColor = 'black';
divider.style.zIndex = '9998';
divider.style.cursor = 'col-resize';
divider.style.display = 'none'; // Initially hide the divider
document.body.appendChild(divider);

// Variables to track mouse state
let isDragging = false;
let currentX;

// Event listener for the DOM button
domButton.addEventListener('click', () => {
  const isVisible = domContainer.style.display === 'none';
  domContainer.style.display = isVisible ? 'block' : 'none';
  divider.style.display = isVisible ? 'block' : 'none'; // Show/hide the divider

  if (isVisible) {
    const domText = document.documentElement.outerHTML;
    domContainer.textContent = domText;
    document.body.style.width = '50%';
  } else {
    domContainer.textContent = '';
    document.body.style.width = '';
  }
});

// Event listener for the input button
inputButton.addEventListener('click', () => {
  const inputElements = document.querySelectorAll('input, button');
  let inputText = '';

  inputElements.forEach((input) => {
    inputText += `${input.outerHTML}\n\n`;
  });

  domContainer.textContent = inputText;
  domContainer.style.display = 'block';
  divider.style.display = 'block'; // Show the divider
  document.body.style.width = '50%';
});

// Event listeners for the divider
divider.addEventListener('mousedown', dragStart);
divider.addEventListener('mouseup', dragEnd);
divider.addEventListener('mousemove', drag);

function dragStart(e) {
  isDragging = true;
  currentX = e.clientX;
}

function dragEnd() {
  isDragging = false;
}

function drag(e) {
  if (isDragging) {
    const delta = e.clientX - currentX;
    currentX = e.clientX;
    divider.style.left = `${newLeft}px`;
    domContainer.style.width = `${100 - (newLeft / window.innerWidth) * 100}%`;
    document.body.style.width = `${(newLeft / window.innerWidth) * 100}%`;
  }
}
