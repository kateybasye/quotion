document.addEventListener('DOMContentLoaded', function () {
    const closeButton = document.getElementById('closeButton');
    console.log(closeButton);
    closeButton.addEventListener('click', function () {
      window.close();
    });
  });