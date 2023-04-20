function goToLinkInNav(index) {
    const navSelector = 'nav div div'; // Replace this with the selector for the target nav element, if needed
    const navElement = document.querySelector(navSelector);
  
    if (navElement) {
      const links = navElement.querySelectorAll('a');
  
      if (links.length > index) {
        links[index].click();
      } else {
        console.log(`No link found at index ${index}`);
      }
    } else {
      console.log('Nav element not found');
    }
  }
  
  function handleKeydown(event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
    if ((isMac && event.ctrlKey) || (!isMac && event.altKey)) {
      const keyNumber = parseInt(event.key, 10);

      if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9) {
        goToLinkInNav(keyNumber - 1);
      }
    }
  }
  
  document.addEventListener('keydown', handleKeydown);
  
  
  document.addEventListener('keydown', handleKeydown);

if (window.location.hostname === 'chat.openai.com') {
    document.addEventListener('keydown', handleKeydown);
}