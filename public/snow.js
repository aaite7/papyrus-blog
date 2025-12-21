
document.addEventListener('DOMContentLoaded', function () {
  const snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  
  const navElement = document.querySelector('nav');
  if (navElement) {
    navElement.style.position = 'relative';
    navElement.appendChild(snowContainer);
  } else {
    document.body.appendChild(snowContainer);
  }

  const snowflakeCount = 50; // Reduced for a smaller area

  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake();
  }

  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    
    const size = Math.random() * 4 + 1; // size from 1px to 5px
    const opacity = Math.random() * 0.7 + 0.3; // opacity from 0.3 to 1.0
    const animationDuration = Math.random() * 5 + 3; // duration from 3s to 8s
    const animationDelay = Math.random() * 8; // delay up to 8s
    const startPosition = Math.random() * window.innerWidth;
    const horizontalDrift = (Math.random() - 0.5) * 40; // horizontal drift

    snowflake.innerHTML = '•'; // Using a dot for smaller flakes
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.opacity = opacity;
    snowflake.style.left = `${startPosition}px`;
    snowflake.style.animationDuration = `${animationDuration}s`;
    snowflake.style.animationDelay = `${animationDelay}s`;
    
    const animationName = `fall-${i}`;
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes ${animationName} {
        from {
          transform: translateY(0) translateX(0);
        }
        to {
          transform: translateY(calc(100% + 10px)) translateX(${horizontalDrift}px);
        }
      }
    `;

    try {
        if (styleSheet.cssRules.length < 1000) { // Avoid bloating the stylesheet
            styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
            snowflake.style.animationName = animationName;
        } else {
            snowflake.style.animationName = 'fall';
        }
    } catch (e) {
        snowflake.style.animationName = 'fall';
    }


    snowContainer.appendChild(snowflake);

    setTimeout(() => {
        snowflake.remove();
        createSnowflake();
    }, (animationDuration + animationDelay) * 1000);
  }
});
