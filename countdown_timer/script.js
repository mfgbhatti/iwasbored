document.addEventListener("DOMContentLoaded", function () {
  const newDate = "1 Jan 2026";
  const daysEL = document.getElementById("days");
  const hoursEL = document.getElementById("hours");
  const minutesEL = document.getElementById("minutes");
  const secondsEL = document.getElementById("seconds");

  function formatTime(time) {
    return time < 10 ? `0${time}` : time;
  }
  function countDown() {
    let newYear = new Date(newDate);
    let today = new Date();
    let totalsecods = (newYear - today) / 1000;
    let days = Math.floor(totalsecods / 3600 / 24);
    let hours = Math.floor(totalsecods / 3600) % 24;
    let minutes = Math.floor(totalsecods / 60) % 60;
    let seconds = Math.floor(totalsecods) % 60;
    // console.log(
    //   "Days: " + days +
    //   ", Hours: " + hours +
    //   ", Minutes: " + minutes +
    //   " and Seconds: " + seconds
    // );

    daysEL.innerHTML = days;
    hoursEL.innerHTML = formatTime(hours);
    minutesEL.innerHTML = formatTime(minutes);
    secondsEL.innerHTML = formatTime(seconds);
  }
  setInterval(countDown, 1000);
});
