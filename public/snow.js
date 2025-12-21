
document.addEventListener('DOMContentLoaded', function () {
  const today = new Date();
  const month = today.getMonth(); // 0 = January, 11 = December

  // Active from November (10) to February (1)
  const isWinter = month >= 10 || month <= 1;

  if (!isWinter) {
    return; // Do nothing if it's not winter
  }

  const snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  document.body.appendChild(snowContainer);

  const snowflakeCount = 150;

  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake();
  }

  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    
    const size = Math.random() * 5 + 2; // size from 2px to 7px
    const opacity = Math.random() * 0.8 + 0.2; // opacity from 0.2 to 1.0
    const animationDuration = Math.random() * 10 + 5; // duration from 5s to 15s
    const animationDelay = Math.random() * 15; // delay up to 15s
    const startPosition = Math.random() * window.innerWidth;
    const horizontalDrift = (Math.random() - 0.5) * 80; // horizontal drift

    snowflake.innerHTML = '❄';
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.opacity = opacity;
    snowflake.style.left = `${startPosition}px`;
    snowflake.style.animationDuration = `${animationDuration}s`;
    snowflake.style.animationDelay = `${animationDelay}s`;

    // Custom animation for each snowflake
    const animationName = `fall-${i}`;
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes ${animationName} {
        from {
          transform: translateY(0) translateX(0);
        }
        to {
          transform: translateY(105vh) translateX(${horizontalDrift}px);
        }
      }
    `;
    
    try {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        snowflake.style.animationName = animationName;
    } catch (e) {
        // Fallback to the generic animation if insertRule fails (e.g., in some strict environments)
        snowflake.style.animationName = 'fall';
    }

    snowContainer.appendChild(snowflake);

    // Remove snowflake after it falls to keep the DOM clean
    setTimeout(() => {
        snowflake.remove();
        // Create a new one to keep the snow falling
        createSnowflake();
    }, (animationDuration + animationDelay) * 1000);
  }
});
