// var nameError = document.getElementById('name-error');
//     var phoneError = document.getElementById('phone-error');
//     var emailError = document.getElementById('email-error');
//     var passwordError = document.getElementById('password-error');
//     var submitError = document.getElementById('submit-error');

//     function validateName() {
//         var name = document.getElementById('contact-name').value;

//         if (name.length == 0) {
//             nameError.innerHTML = 'Name is required';
//             return false;
//         }
//         if (!name.match(/^[A-Za-z]*\s{1}[A-Za-z]*$/)) {
//             nameError.innerHTML = 'Write full Name';
//             return false;
//         }
//         nameError.innerHTML = '<i  class="fa-solid fa-circle-check log"></i>';
//         return true;
//     }

//     function validatePhone() {
//         var phone = document.getElementById('phone-no').value;

//         if (phone.length == 0) {
//             phoneError.innerHTML = 'Phone no is required';
//             return false;
//         }
//         if (phone.length !== 10) {
//             phoneError.innerHTML = 'Phone no should be 10 digits';
//             return false;
//         }
//         if (!phone.match(/^[0-9]{10}$/)) {
//             phoneError.innerHTML = 'only digits please';
//             return false;
//         }

//         phoneError.innerHTML = '<i  class="fa-solid fa-circle-check log"></i>';
//         return true;
//     }

//     function validateEmail() {
//         var email = document.getElementById('contact-email').value;

//         if (email.length == 0) {
//             emailError.innerHTML = 'Email is required';
//             return false;
//         }
//         if (!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
//             emailError.innerHTML = 'Email is invalid';
//             return false;
//         }
//         emailError.innerHTML = '<i  class="fa-solid fa-circle-check log"></i>';
//         return true;
//     }

//     function validatePassword() {
//         var password = document.getElementById('password').value;

//         if (password.length == 0) {
//             passwordError.innerHTML = 'password empty';
//             return false;
//         }
//         passwordError.innerHTML = '<i  class="fa-solid fa-circle-check log"></i>';
//         return true;
//     }


//     function validateForm() {
//         if (!validateName() || !validatePhone() || !validateEmail() || !validatePassword() ) {
//             submitError.style.display = 'block';
//             submitError.innerHTML = 'Please fill all field';
//             setTimeout(function () { submitError.style.display = 'none' }, 3000)
//             return false;
//         }
//     }