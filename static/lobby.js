document.getElementById('match-button').addEventListener('click',(e)=>{
    localStorage.setItem('name',document.getElementById('name-input').value);
    window.location.href = 'match';
});