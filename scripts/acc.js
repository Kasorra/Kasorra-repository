function acc_button() {
    if (document.querySelector(".acc_bg")) {
        return;
    }

    const acc = document.querySelector(".account-button");

    let bg = document.createElement('div');
    bg.className = "acc_bg";

    let lock = document.createElement('img');
    lock.src = "images/lock2.png";
    lock.className = "lock-icon";

    let login_header = document.createElement('p');
    login_header.className = "login_header";
    login_header.textContent = "Welcome Back";

    let login_subheader = document.createElement('p');
    login_subheader.className = "login_subheader";
    login_subheader.textContent = "Sign in to your Account";

    let exit = document.createElement('button');
    exit.className = "exit_button";
    exit.textContent = "x";
    exit.onclick = close_overlay;

    let input_container = document.createElement('div');
    input_container.className = "input_container";

    let form = document.createElement('form');
    form.className = 'form_tag';
    form.onsubmit = handle_login; //function handle_login

    let email_header = document.createElement('p');
    email_header.className = "email_header";
    email_header.textContent = "Email or Username";

    /*let email_icon = document.createElement('img');
    email_icon.src = "images/mail.png";
    email_icon.className = "input_icon"; 

    let email_text = document.createElement('p');
    email_text.className = "input_text";
    email_text.textContent = "Enter your username or email"; */

    let email = document.createElement('input');
    email.type = "text";
    email.name = "email";
    email.placeholder = "Enter your username or email";
    email.className = "input_tag";

    let password_header = document.createElement('p');
    password_header.className = "password_header";
    password_header.textContent = "Password";

    /*let password_icon = document.createElement('img');
    password_icon.src = "images/lock4.png";
    password_icon.className = "input_icon"; */

    let password = document.createElement('input');
    password.type = "password";
    password.name = "password";
    password.placeholder = "Enter your password";
    password.className = "input_tag";

    let submit = document.createElement('button');
    submit.textContent = "Sign In";
    submit.value = "Log In";
    submit.className = "submit_button";

    let signUp_header = document.createElement('p');
    signUp_header.className = "signUp_header";
    signUp_header.textContent = "-----------  or continue with  -----------";

    let thirdParty_container = document.createElement('div');
    thirdParty_container.className = "thirdParty_container";

    let google_icon = document.createElement('img');
    google_icon.src = "images/google.png";
    google_icon.className = "google_icon";

    let google_button = document.createElement('button');
    google_button.className = "google_button";

    google_button.appendChild(google_icon);

    let google_text = document.createElement('p');
    google_text.className = "google_text";
    google_text.textContent ="Google";

    google_button.appendChild(google_text);

    thirdParty_container.appendChild(google_button);

    let no_acc_container = document.createElement('div');
    no_acc_container.className = "no_acc_container";

    let no_acc = document.createElement('p');
    no_acc.className = "no_acc";
    no_acc.textContent = "Don't have an account? ";

    let sign_up = document.createElement('button');
    sign_up.className = "sign_up";
    sign_up.textContent = "Sign up";
    
    sign_up.addEventListener("click", signUp_overlay);

    no_acc_container.appendChild(no_acc);
    no_acc_container.appendChild(sign_up);

    input_container.appendChild(email_header);
    input_container.appendChild(email);
    input_container.appendChild(password_header);
    input_container.appendChild(password);

    form.appendChild(input_container);
    form.appendChild(submit);

    bg.appendChild(lock);
    bg.appendChild(login_header);
    bg.appendChild(login_subheader);
    bg.appendChild(exit);
    bg.appendChild(signUp_header);
    bg.appendChild(form);
    bg.appendChild(thirdParty_container);
    bg.appendChild(no_acc_container);

    document.body.appendChild(bg);

    document.body.classList.add("no-scroll");
}

function handle_login(event) { 
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    if (email.trim() === "" || password.trim() === "") {
        let error_container = form.querySelector(".error_container") || document.createElement('div');
        error_container.className = "error_container";

        let error_message = document.createElement('p');
        error_message.textContent = "Please Fill in all the fields."
        error_container.innerHTML = "";
        error_container.appendChild(error_message);
        form.appendChild(error_container);
        return;
    }

    // Here you’d send data to backend/database
    console.log("Sending:", { email, password });
}

function close_overlay() {
    const overlay_signIn = document.querySelector('.acc_bg');
    const overlay_signUp = document.querySelector('.signUp_bg');

    if (overlay_signIn) overlay_signIn.remove();
    if (overlay_signUp) overlay_signUp.remove();

    document.body.classList.remove("no-scroll");
}

function open_cart(){
    window.location.href = "cart-page.html";
}

function signUp_overlay(){
    const logIn_overlay = document.querySelector('.acc_bg');
    if (logIn_overlay) logIn_overlay.remove();

    let bg = document.createElement('div');
    bg.className = "signUp_bg";

    let container = document.createElement('div');
    container.className = "signUp_container";

    let replaceable_container = document.createElement('div');
    replaceable_container.className = "replaceable_container";

    let lock = document.createElement('img');
    lock.src = "images/person.png";
    lock.className = "person-icon";

    let login_header = document.createElement('p');
    login_header.className = "login_header";
    login_header.textContent = "Create Account";

    let login_subheader = document.createElement('p');
    login_subheader.className = "login_subheader";
    login_subheader.textContent = "Join thousands of businesses on our platform";

    let exit = document.createElement('button');
    exit.className = "exit_button2";
    exit.textContent = "x";
    exit.onclick = close_overlay;

    let direction = document.createElement('p');
    direction.className = "direction-text";
    direction.textContent = "I want to";

    let button_container = document.createElement('div');
    button_container.className = "button_container";

    let buy = document.createElement('button');
    buy.className = "buy-btn";
    buy.onclick = () => buyer_option(replaceable_container);

    let buy_icon = document.createElement('img');
    buy_icon.src = "images/cartss.png";
    buy_icon.className = "buy_icon";

    let buy_header = document.createElement('span');
    buy_header.className = "sb_header";
    buy_header.textContent = "Buy Products";

    let buy_subheader = document.createElement('span');
    buy_subheader.className = "sb_subheader";
    buy_subheader.textContent = "Source From Suppliers";

    let sell = document.createElement('button');
    sell.className = "sell-btn";
    sell.onclick = () => seller_option(replaceable_container);

    let sell_icon = document.createElement('img');
    sell_icon.src = "images/buildings.png";
    sell_icon.className = "sell_icon";

    let sell_header = document.createElement('span');
    sell_header.className = "sb_header";
    sell_header.textContent = "Sell Products";

    let sell_subheader = document.createElement('span');
    sell_subheader.className = "sb_subheader";
    sell_subheader.textContent = "Become a supplier";

    buy.appendChild(buy_icon);
    buy.appendChild(buy_header);
    buy.appendChild(buy_subheader);

    sell.appendChild(sell_icon);
    sell.appendChild(sell_header);
    sell.appendChild(sell_subheader);

    button_container.appendChild(buy);
    button_container.appendChild(sell);

    let form = document.createElement('form');
    form.className = "form-container";

    container.appendChild(lock);
    container.appendChild(login_header);
    container.appendChild(login_subheader);
    container.appendChild(exit);
    container.appendChild(direction);
    container.appendChild(button_container);
    container.appendChild(replaceable_container);

    bg.appendChild(container);

    document.body.appendChild(bg);
}

function buyer_option(replaceable_container) {
    replaceable_container.innerHTML = "";

    let firstName_header = document.createElement('span');
    firstName_header.className = "name_header_option";
    firstName_header.textContent = "First Name";

    let lastName_header = document.createElement('span');
    lastName_header.className = "name_header_option";
    lastName_header.textContent = "Last Name";

    let form = document.createElement('form');
    form.className = "buyer_option_form";
    form.onsubmit = handle_buyer_signUp; //for later

    let firstName_input = document.createElement('input');
    firstName_input.className = "buyer_option_Name_input";
    firstName_input.type = "text";
    firstName_input.placeholder = "Enter your First Name";

    let lastName_input = document.createElement('input');
    lastName_input.className = "seller_option_Name_input";
    lastName_input.type = "text";
    lastName_input.placeholder = "Enter your Last Name";

    let firstName_wrapper = document.createElement('div');
    firstName_wrapper.className = "Names_signUp_wrapper";

    firstName_wrapper.appendChild(firstName_header);
    firstName_wrapper.appendChild(firstName_input);

    let lastName_wrapper = document.createElement('div');
    lastName_wrapper.className = "Names_signUp_wrapper";

    lastName_wrapper.appendChild(lastName_header);
    lastName_wrapper.appendChild(lastName_input);

    let name_wrapper = document.createElement('div');
    name_wrapper.className = "option_name_wrapper";

    name_wrapper.appendChild(firstName_wrapper);
    name_wrapper.appendChild(lastName_wrapper);

    let option_outer_container = document.createElement('div');
    option_outer_container.className = "option_outer_container";

    let email_container = document.createElement('div');
    email_container.className = "option_email_container";

    let email_input_header = document.createElement('span');
    email_input_header.className = "email_input_header";
    email_input_header.textContent = "Email";

    let email_input = document.createElement('input');
    email_input.type = "email";
    email_input.placeholder = "Example@company.com";
    email_input.className = "option_email_input";

    email_container.appendChild(email_input_header);
    email_container.appendChild(email_input);

    let phone_container = document.createElement('div');
    phone_container.className = "option_phone_container";

    let phone_header = document.createElement('span');
    phone_header.className = "option_phone_header";
    phone_header.textContent = "Phone Numer";

    let phone_input = document.createElement('input');
    phone_input.type = "tel";
    phone_input.placeholder = "(+63) 000 000 0000";
    phone_input.className = "option_phone_input";

    phone_container.appendChild(phone_header);
    phone_container.appendChild(phone_input);

    let password_container = document.createElement('div');
    password_container.className = "option_password_container";

    let password_header = document.createElement('span');
    password_header.className = "option_password_header";
    password_header.textContent = "Password";

    let password_input = document.createElement('input');
    password_input.type = "passowrd";
    password_input.placeholder = "Create a strong password";
    password_input.className = "option_password_input";

    password_container.appendChild(password_header);
    password_container.appendChild(password_input);

    let password_container_confirm = document.createElement('div');
    password_container_confirm.className = "option_password_container";

    let password_header_confirm = document.createElement('span');
    password_header_confirm.className = "option_password_header_confirm";
    password_header_confirm.textContent = "Confirm Password";

    let password_input_confirm = document.createElement('input');
    password_input_confirm.type = "passowrd";
    password_input_confirm.placeholder = "Re-enter your Password";
    password_input_confirm.className = "option_password_input_confrim";

    password_container_confirm.appendChild(password_header_confirm);
    password_container_confirm.appendChild(password_input_confirm);

    form.appendChild(name_wrapper);
    form.appendChild(email_container);
    form.appendChild(phone_container);
    form.appendChild(password_container);
    form.appendChild(password_container_confirm);

    option_outer_container.appendChild(form)

    replaceable_container.appendChild(option_outer_container);
}

function seller_option(replaceable_container) {
    replaceable_container.innerHTML = "";


    let firstName_header = document.createElement('span');
    firstName_header.className = "name_header_option";
    firstName_header.textContent = "First Name";

    let lastName_header = document.createElement('span');
    lastName_header.className = "name_header_option";
    lastName_header.textContent = "Last Name";

    let form = document.createElement('form');
    form.className = "buyer_option_form";
    form.onsubmit = handle_buyer_signUp; //for later

    let firstName_input = document.createElement('input');
    firstName_input.className = "buyer_option_Name_input";
    firstName_input.type = "text";
    firstName_input.placeholder = "Enter your First Name";

    let lastName_input = document.createElement('input');
    lastName_input.className = "seller_option_Name_input";
    lastName_input.type = "text";
    lastName_input.placeholder = "Enter your Last Name";

    let firstName_wrapper = document.createElement('div');
    firstName_wrapper.className = "Names_signUp_wrapper";

    firstName_wrapper.appendChild(firstName_header);
    firstName_wrapper.appendChild(firstName_input);

    let lastName_wrapper = document.createElement('div');
    lastName_wrapper.className = "Names_signUp_wrapper";

    lastName_wrapper.appendChild(lastName_header);
    lastName_wrapper.appendChild(lastName_input);

    let name_wrapper = document.createElement('div');
    name_wrapper.className = "option_name_wrapper";

    name_wrapper.appendChild(firstName_wrapper);
    name_wrapper.appendChild(lastName_wrapper);

    let option_outer_container = document.createElement('div');
    option_outer_container.className = "option_outer_container";

    let email_container = document.createElement('div');
    email_container.className = "option_email_container";

    let email_input_header = document.createElement('span');
    email_input_header.className = "email_input_header";
    email_input_header.textContent = "Email";

    let email_input = document.createElement('input');
    email_input.type = "email";
    email_input.placeholder = "Example@company.com";
    email_input.className = "option_email_input";

    email_container.appendChild(email_input_header);
    email_container.appendChild(email_input);

    let phone_container = document.createElement('div');
    phone_container.className = "option_phone_container";

    let phone_header = document.createElement('span');
    phone_header.className = "option_phone_header";
    phone_header.textContent = "Phone Numer";

    let phone_input = document.createElement('input');
    phone_input.type = "tel";
    phone_input.placeholder = "(+63) 000 000 0000";
    phone_input.className = "option_phone_input";

    phone_container.appendChild(phone_header);
    phone_container.appendChild(phone_input);

    let company_name_container = document.createElement('div');
    company_name_container.className = "company_name_container";

    let company_name = document.createElement('span');
    company_name.className = "option_company_name";
    company_name.textContent = "Company Name";

    let company_name_input = document.createElement('input');
    company_name_input.type = "text";
    company_name_input.className = "option_company_name_input";
    company_name_input.placeholder = "Your Company Name";

    company_name_container.appendChild(company_name);
    company_name_container.appendChild(company_name_input);


    let password_container = document.createElement('div');
    password_container.className = "option_password_container";

    let password_header = document.createElement('span');
    password_header.className = "option_password_header";
    password_header.textContent = "Password";

    let password_input = document.createElement('input');
    password_input.type = "passowrd";
    password_input.placeholder = "Create a strong password";
    password_input.className = "option_password_input";

    password_container.appendChild(password_header);
    password_container.appendChild(password_input);

    let password_container_confirm = document.createElement('div');
    password_container_confirm.className = "option_password_container";

    let password_header_confirm = document.createElement('span');
    password_header_confirm.className = "option_password_header_confirm";
    password_header_confirm.textContent = "Confirm Password";

    let password_input_confirm = document.createElement('input');
    password_input_confirm.type = "passowrd";
    password_input_confirm.placeholder = "Re-enter your password";
    password_input_confirm.className = "option_password_input_confrim";

    password_container_confirm.appendChild(password_header_confirm);
    password_container_confirm.appendChild(password_input_confirm);

    form.appendChild(name_wrapper);
    form.appendChild(email_container);
    form.appendChild(phone_container);
    form.appendChild(company_name_container);
    form.appendChild(password_container);
    form.appendChild(password_container_confirm);

    option_outer_container.appendChild(form)

    replaceable_container.appendChild(option_outer_container);
}

function handle_buyer_signUp() {

}

function handle_supplier_signUp() {

}

function handle_buyer_signUp(){
    
}
