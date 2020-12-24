'use strict'
//array of objects 
let myLibrary = [
    {
        title: "The Brothers Karamazov",
        author: "Fyodor Dostoevsky",
        pages: 796,
        read: true
    },
    {
        title: "The Archetypes and the Collective Unconscious",
        author: "Carl G. Jung",
        pages: 390,
        read: true
    },
    {
        title: "Algorithm for Optimization",
        author: "Mykel J. Kochenderfer and Tim A. Wheeler",
        pages: 520,
        read: false
    },
    {
        title: "Algorithm for Optimization",
        author: "Mykel J. Kochenderfer and Tim A. Wheeler",
        pages: 520,
        read: false
    }];
let headers = ['Title', 'Author', 'Total Pages', 'Read Status'] //list of prop headers
let isAscend = false; //sorting order
let userId;

//instances of DOM Elements
const btnContainer = document.getElementById('button-container');
const popUpForm = document.querySelector('.form-popup');
const removeDuplicates = document.getElementById('removeDuplicates');
const removeAll = document.getElementById('removeAll');
const libraryGrid = document.getElementById('library-grid');
const libraryTableCont = document.getElementById('library-table-container');
const form = document.getElementById('myForm');
const btnFormat = document.querySelectorAll('.lib-btn-format');
const mainHeader = document.getElementById('main-header');
const elVisual = document.getElementById('full-width-visual');
const profileContainer = document.getElementById('profileContainer');

function retrieveDataFromCloud() {
    myLibrary = [];
    let remoteLibraryRef = firebase.database().ref(`library/${userId}/books`);
    remoteLibraryRef.on('value', (snap) => {
        console.log(snap.val());
        snap.forEach((k,i) =>{
            let book = new Books;
            book.title = k.val().title;
            book.author = k.val().author;
            book.pages = k.val().pages;
            book.read = k.val().read;
            myLibrary.push(book);
        });
    });
    displayBooks();
}
function storeDataToCloud() {
    firebase.database().ref(`library/${userId}`).update({
        books: myLibrary
    });
}

function userProfile(givenName, fullName, userImage) {
    //profile user
    document.getElementById('header-text').textContent = `${givenName}\'s Library`;
    const googleImage = document.createElement('img');
    profileContainer.appendChild(googleImage);
    googleImage.className = 'googleImage';
    googleImage.src = userImage;

    const userFullName = document.createElement('span');
    profileContainer.appendChild(userFullName);
    userFullName.className = 'userFullName';
    userFullName.textContent = fullName;
    document.querySelector('.g-signin2').style.visibility = 'hidden';
    document.querySelector('.sign-out').style.visibility = 'visible';
    profileContainer.style.visibility = 'visible';
}
//Firebase authentication
function onSignIn(googleUser) {
    let profile = googleUser.getBasicProfile();
    let givenName = profile.getGivenName();
    let userName = profile.getName();
    let userImage = profile.getImageUrl();
   
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    let unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
        unsubscribe();
        userId = firebaseUser.uid;
        // Check if we are already signed-in Firebase with the correct user.
        if (!isUserEqual(googleUser, firebaseUser)) {
            // Build Firebase credential with the Google ID token.
            let credential = firebase.auth.GoogleAuthProvider.credential(
                googleUser.getAuthResponse().id_token);
            retrieveDataFromCloud();
            userProfile(givenName,userName,userImage);
            // Sign in with credential from the Google user.
            firebase.auth().signInWithCredential(credential).catch((error) => {
                // Handle Errors here.
                let errorCode = error.code;
                let errorMessage = error.message;
                // The email of the user's account used.
                let email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                let credential = error.credential;
                // ...
                console.log(errorCode, errorMessage, email, credential);
            });
        } else {
            userProfile(givenName, userName, userImage);
            retrieveDataFromCloud();
            console.log('User already signed-in Firebase.');
        }
    });
}
//checks if the googleuser and firebaseuser is equal
function isUserEqual(googleUser, firebaseUser) {
    if (firebaseUser) {
        let providerData = firebaseUser.providerData;
        for (let i = 0; i < providerData.length; i++) {
            if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
                providerData[i].uid === googleUser.getBasicProfile().getId()) {
                // We don't need to reauth the Firebase connection.
                return true;
            }
        }
    }
    return false;
}
//what happens after the user signed out
function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        document.getElementById('header-text').textContent = `Library`;
        profileContainer.style.visibility = 'hidden';
        document.querySelector('.g-signin2').style.visibility = 'visible';
        document.querySelector('.sign-out').style.visibility = 'hidden';
        while (profileContainer.firstChild) {
            profileContainer.removeChild(profileContainer.firstChild);
        }
        storeDataToCloud();
        userId = '';
        console.log('User signed out.');
        myLibrary = [];
        displayBooks();
    });
}

//constructor of books class
class Books {
    constructor(title, author, pages, read) {
        this.title = title
        this.author = author
        this.pages = pages
        this.read = read;
    }
}
//adding books to library and redisplaying books after submitting a new book through destroying it first 
function addBookToLibrary() {
    let newBook = new Books(document.getElementById('bookTitle').value,
        document.getElementById('bookAuthor').value,
        document.getElementById('bookPageNumber').value,
        document.getElementById('bookReadStatus').checked);
    myLibrary.push(newBook);
    popUpForm.style.display = "none"; //hide form after submit
    displayBooks();
}

//remove all grid elements that display the book info
function removeGridDisplay() {
    while (libraryGrid.firstChild) {
        libraryGrid.removeChild(libraryGrid.firstChild);
    }
}

//remove all table elements that display the book info
function removeTableDisplay() {
    while (libraryTableCont.firstChild && !libraryTableCont.firstChild.remove());
}

/*recreating books - it's functionality is to update books by removing the target 
elements and recreating it which is called multiple times*/
function recreateBooksInGridFormat() {
    document.getElementById('button-parent-container').appendChild(btnContainer);
    document.getElementById('sort-dropdown').style.display = "block";
    removeTableDisplay();
    removeGridDisplay();
    btnContainer.style.display = 'block';
    for (let i = 0; i < myLibrary.length; i++) {
        createGridElements(i);
    }
    //removing the targeted book
    document.querySelectorAll('.remove-book').forEach((book, index) => {
        book.addEventListener('click', () => {
            myLibrary.splice(index, 1);
            /*alternative method to e.stopPropagation since it will not work as its end line is recalling the previous 
            function and skipping this block of code as it is not meant to be clicked twice*/
            if (myLibrary.length === 0 && index === 0 || index === myLibrary.length) return recreateBooksInGridFormat();
            myLibrary[index].read === true ? myLibrary[index].read = false : myLibrary[index].read = true;
            recreateBooksInGridFormat();
        });
    });
    //toggle read or not read
    document.querySelectorAll('.book-grid').forEach((book, index) => {
        book.addEventListener('click', () => {
            myLibrary[index].read === true ? myLibrary[index].read = false : myLibrary[index].read = true;
            recreateBooksInGridFormat();
        });
    });
}
function recreateBooksInTableFormat() {
    document.getElementById('sort-dropdown').style.display = "none";
    btnContainer.style.display = 'block';
    removeGridDisplay();
    removeTableDisplay();
    createTable();
}
//display books including the intended DOM elements with style manipulation involved
function displayBooks() {
    if (document.getElementById('grid-button').classList.contains('active-format')) {
        recreateBooksInGridFormat();

    }
    else if (document.getElementById('table-button').classList.contains('active-format')) {
        recreateBooksInTableFormat();
    }
}

//adding visual and animation reset
function activeDiv(divID) {
    btnFormat.forEach(el => el.classList.remove('active-format'));//remove active state from all btns
    document.getElementById(divID).classList.add('active-format');//add active style  
    mainHeader.replaceChild(elVisual, elVisual);//restarting animation
    displayBooks();
}

//create elements after submitting form
function createGridElements(i) {
    const bookGrid = document.createElement('div');
    bookGrid.id = i;
    libraryGrid.appendChild(bookGrid);
    bookGrid.classList.add('book-grid');

    const remove = document.createElement('div');
    bookGrid.appendChild(remove);
    remove.classList.add('remove-book');

    const bookTitle = document.createElement('p');
    bookGrid.appendChild(bookTitle);
    bookTitle.classList.add('book-info');

    const bookAuthor = document.createElement('p');
    bookGrid.appendChild(bookAuthor);
    bookAuthor.classList.add('book-info');

    const pageNumber = document.createElement('p');
    bookGrid.appendChild(pageNumber);
    pageNumber.classList.add('book-info');

    const readStatus = document.createElement('p');
    readStatus.ID = i;
    bookGrid.appendChild(readStatus);
    readStatus.classList.add('book-info');

    remove.textContent = 'x';
    bookTitle.textContent = myLibrary[i].title;
    myLibrary[i].author == "" ? bookAuthor.textContent = `by Anonymous` : bookAuthor.textContent = `by ${myLibrary[i].author}`;
    pageNumber.textContent = `total of ${myLibrary[i].pages} pages`;
    if (myLibrary[i].read == true) {
        bookGrid.setAttribute('style', 'background: rgb(142, 142, 224);');
        readStatus.textContent = 'Reading: Completed';
    }
    else {
        bookGrid.setAttribute('style', 'background: rgb(142, 142, 142);')
        readStatus.textContent = 'Reading: Not completed';
    }

    //sorting button for grid
    window.onclick = (event) => {
        document.getElementById('myDropdown').classList.toggle('show');
        if (!event.target.matches('.dropdown-btn')) {
            let dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                let openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
}

//craete table elements and display it
function createTable() {
    //instances of DOM elements that wraps the entirety of table and remove buttons
    const tableWrapper = document.createElement('table');
    tableWrapper.className = 'borderless';
    const caption = document.createElement('caption');
    caption.textContent = "All books in your library";
    const tableRowWrapper = document.createElement('tr');
    tableRowWrapper.className = 'borderless';
    const tableDataWrapper = document.createElement('td');
    tableDataWrapper.className = 'borderless';
    const tableDataWrapper2 = document.createElement('td');
    tableDataWrapper2.className = 'remove-rows-container';
    libraryTableCont.appendChild(tableWrapper);
    tableWrapper.appendChild(tableRowWrapper);
    tableWrapper.appendChild(caption);
    tableRowWrapper.appendChild(tableDataWrapper);
    tableRowWrapper.appendChild(tableDataWrapper2);

    const table = document.createElement('table');
    table.id = "inner-table";
    const headerRow = document.createElement('tr');

    /*create the header row and insert its data throughout the iteration 
    of an array containing header names*/
    headers.forEach(item => {
        const header = document.createElement('th');
        const textNode = document.createTextNode(item);
        const icon = document.createElement('i');
        header.appendChild(textNode);
        header.appendChild(icon);
        headerRow.appendChild(header);
        icon.classList.add('fa');
        isAscend !== true ? icon.classList.add('fa-sort-up') : icon.classList.add('fa-sort-down');
    });

    //header hover visual
    headerRow.childNodes.forEach(el => el.classList.add('table-headers'));
    table.appendChild(headerRow);
    tableDataWrapper.appendChild(table);

    //create rows and insert object data
    myLibrary.forEach(obj => {
        const contentRow = document.createElement('tr');

        Object.values(obj).forEach(item => {
            const cell = document.createElement('td');
            const textNode = document.createTextNode(item);
            if (item === "") {
                textNode.textContent = 'Anonymous';
            }
            if (item === true || item === false) {
                item === true ? textNode.textContent = 'completed' : textNode.textContent = 'not finished';
            }
            cell.appendChild(textNode);
            contentRow.appendChild(cell);
        });
        table.appendChild(contentRow);

        const removeRow = document.createElement('button');
        removeRow.textContent = 'r';
        removeRow.title = "Remove row";
        removeRow.classList.add('remove-rows');
        tableDataWrapper2.appendChild(removeRow);
    });

    //adding event listener to multiple buttons that removes the row data equal to its index
    document.querySelectorAll('.remove-rows').forEach((el, index) => {
        el.addEventListener('click', () => {
            myLibrary.splice(index, 1);
            displayBooks();
        });
    });
    //add sort to table
    const tableHeaders = document.querySelectorAll('.table-headers');
    sorting(tableHeaders, isAscend);

    //creates a row that contains an add a book button
    const newRow = document.createElement('tr')
    for (let i = 0; i < headers.length; i++) {
        const newCell = document.createElement('td');
        newCell.textContent = "";
        newRow.appendChild(newCell);
        if (i == 1) {
            newCell.appendChild(btnContainer);
        }
    }
    table.appendChild(newRow);
}
//sorting functionality for grids - ascending only
const sortingItems = document.querySelectorAll('.sort-items');
sorting(sortingItems, isAscend);

/*sorting system - when the targeted div is clicked, it saves a snapshot of text content and 
compares it by using the switch which gets the reference of specific book property name smilarly to the 
text content - doesn't seem to be the best solution but it works fine*/
function sorting(multipleEl, sortOrder) {
    multipleEl.forEach((text, index) => {
        text.addEventListener('click', function (e) {
            let prop = e.target.textContent;
            switch (prop) {
                case 'Title':
                    prop = 'title';
                    break;
                case 'Author':
                    prop = 'author';
                    break;
                case 'Total Pages':
                    prop = 'pages';
                    break;
                case 'Pages Number':
                    prop = 'pages';
                    break;
                case 'Read Status':
                    prop = 'read';
                    break;
                case 'Completion':
                    prop = 'read';
                    break;
                default:
                    prop = "";
            }
            /*special condition as it is boolean and the value changes
            when the reacreation grid function is called */
            if (prop === 'read') {
                myLibrary.sort((a, b) => {
                    let x = a[prop];
                    let y = b[prop];
                    return sortOrder !== true ? y - x : x - y;
                });
            }
            else {
                myLibrary.sort((a, b) => {
                    //Prevents case-sensitivity 
                    const x = (typeof a[myLibrary[prop]] === 'string')
                        ? a[prop].toUpperCase() : a[prop];
                    const y = (typeof b[myLibrary[prop]] === 'string')
                        ? b[prop].toUpperCase() : b[prop];
                    if (sortOrder !== true) {
                        return x > y ? 1 : -1;
                    } else {
                        return x < y ? 1 : -1;
                    }
                });
            }
            //after sort this global variable toggles to false /=/ true
            sortOrder !== true ? isAscend = true : isAscend = false;
            console.table(sortOrder);
            displayBooks();
        });
    })
}

//submit form
form.addEventListener('submit', (e) => {
    e.preventDefault();
    addBookToLibrary();
});

//removes the duplicate name and author using the built-in array filter
removeDuplicates.addEventListener('click', () => {
    myLibrary = myLibrary.filter((prop, index, self) =>
        self.findIndex(p => p.title === prop.title && p.author === prop.author) === index);
    displayBooks();
});
removeAll.onclick = () => {
    firebase.database().ref('object/' + 'library/').remove;
    myLibrary = [];
    displayBooks();
}

document.getElementById('showForm').onclick = () => popUpForm.style.display = "block";
document.getElementById('closeForm').onclick = () => popUpForm.style.display = "none";
displayBooks();