
document.addEventListener('DOMContentLoaded', function () {
  const navElement = document.querySelector('nav');
  if (!navElement) return;

  // Ensure the nav element can contain a positioned element
  navElement.style.position = 'relative';

  const snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  navElement.appendChild(snowContainer);
  
  const navHeight = navElement.clientHeight;
  const snowflakeCount = 40; // Adjusted for a smaller area

  // Use a shared stylesheet to avoid creating too many rules
  const styleSheet = document.createElement('style');
  document.head.appendChild(styleSheet);

  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake(i, styleSheet.sheet);
  }

  function createSnowflake(id, sheet) {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    
    const size = Math.random() * 8 + 4; // size from 4px to 12px
    const opacity = Math.random() * 0.5 + 0.3; // opacity from 0.3 to 0.8
    const animationDuration = Math.random() * 8 + 5; // duration from 5s to 13s
    const animationDelay = Math.random() * 13;
    const startPosition = Math.random() * navElement.clientWidth;
    const horizontalDrift = (Math.random() - 0.5) * 60;

    snowflake.innerHTML = '雪'; // Using the Chinese character for snow
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.opacity = opacity;
    snowflake.style.left = `${startPosition}px`;
    snowflake.style.animationDuration = `${animationDuration}s`;
    snowflake.style.animationDelay = `${animationDelay}s`;
    
    const animationName = `fall-${id}`;
    
    // Define unique keyframes for each snowflake for varied paths
    const keyframes = `
      @keyframes ${animationName} {
        from {
          transform: translateY(-15px) translateX(0);
        }
        to {
          transform: translateY(${navHeight}px) translateX(${horizontalDrift}px);
        }
      }
    `;

    try {
      // Add the rule and apply the animation
      sheet.insertRule(keyframes, sheet.cssRules.length);
      snowflake.style.animationName = animationName;
    } catch (e) {
      // Fallback for safety, though it should work with the new sheet
      snowflake.style.animationName = 'fall';
    }

    snowContainer.appendChild(snowflake);

    // Clean up and replace the snowflake after it has fallen
    setTimeout(() => {
      snowflake.remove();
      createSnowflake(id, sheet); // Recreate the specific snowflake
    }, (animationDuration + animationDelay) * 1000);
  }
});
