const requestsDiv = document.getElementById("requests");
const requestPreviewDiv = document.getElementById("requestPreview");
const importModal = new bootstrap.Modal(document.getElementById('importCollections'));
const settings = {

    collectionskey: "collections",
    supportedMethods: ["GET", "POST", "DELETE"],
    serverUrl: "http://localhost:6001",
    backendApiKey: "mySecureApiKey321",
};

loadRequests();

class collection {

    constructor(name) {

        this.name = name;
        this.description = null;
        this.requests = [];
        this.folders = [];
    }

    set Description(description) {

        if (description === undefined || description === null || description === "") {

            this.description = null;
        } else {

            this.description = description;
        }
    }
};

class folder {

    constructor(name) {

        this.name = name;
        this.description = null;
        this.requests = [];
    }

    set Description(description) {

        if (description === undefined || description === null || description === "") {

            this.description = null;
        } else {

            this.description = description;
        }
    }
};

class request {

    constructor(name, method, endpoint, body) {

        this.name = name;
        this.object = {

            method: method,
            url: `${settings.serverUrl}/${endpoint}`,
            headers: {

                'Content-Type': 'application/json'
            },
            data: body
        };
    }
};

function createCollection() {

    const collections = getFromLocalStorage(settings.collectionskey);
    const collectionName = promptForInput("Enter Collection Name:");
    const createdCollection = new collection(collectionName);
    saveInLocalStorage(settings.collectionskey, collections === null ? [createdCollection] : [...collections, createdCollection]);
    loadRequests();
};

function createFolder(collectionName, collections) {

    const index = collections.findIndex(collection => collection.name === collectionName);
    const folderName = promptForInput("Enter Folder Name:");
    const createdFolder = new folder(folderName);
    collections[index].folders = collections[index].folders || [];
    collections[index].folders.push(createdFolder);
    saveInLocalStorage(settings.collectionskey, collections);
    loadRequests();
};

function createRequest(requestCollectionName, folderName) {

    let collections = getFromLocalStorage(settings.collectionskey);
    const requestName = promptForInput("Enter Request Name:");
    const requestMethod = promptForInput(`Enter Request Method (${settings.supportedMethods.join(", ")}):`).toLowerCase();

    if (!settings.supportedMethods.includes(requestMethod.toUpperCase())) {

        const error = new Error(`Unsupported method: ${requestMethod}`);
        alert(error);
        throw error;
    }

    const requestEndpoint = promptForInput("Enter Request Endpoint (case sensitive):");
    let requestBody = undefined;

    if (["post", "put", "patch"].includes(requestMethod)) {
        requestBody = promptForInput("Enter Request Body:", true);
    }

    const createdRequest = new request(requestName, requestMethod, requestEndpoint, requestBody);
    saveRequest(collections, requestCollectionName, folderName, createdRequest);
    loadRequests();
};

function saveRequest(collections, requestCollectionName, folderName = null, request) {

    const collection = collections.find(collection => collection.name === requestCollectionName);
    const target = folderName ? collection.folders.find(folder => folder.name === folderName).requests : collection.requests;

    const requestIndex = target.findIndex(req => req.name === request.name);

    if (requestIndex !== -1) {

        target[requestIndex] = request;
    } else {

        target.push(request);
    }

    saveInLocalStorage(settings.collectionskey, collections);
};

function loadRequests() {

    requestsDiv.innerHTML = '';
    const collections = getFromLocalStorage(settings.collectionskey);
    if (collections === null) { return };
    renderCollections(collections);
};

function renderCollections(collections) {

    requestsDiv.innerHTML = '';

    for (const collectionObj of collections) {

        const collectionDetailsElement = document.createElement("details");
        const collectionSummaryElement = document.createElement("summary");
        const collectionDropdownDiv = createDiv("dropdown");
        const collectionDropdownIcon = createIcon("fas fa-ellipsis-h");
        const collectionDropdownButton = createButton("btn btn-sm btn-secondary dropdown-toggle", "", null, { type: "button", "data-bs-toggle": "dropdown", "aria-expanded": "false" });
        const collectionDropdownMenu = document.createElement("ul");
        const createFolderItem = document.createElement("li");
        const createRequestItem = document.createElement("li");
        const deleteCollectionItem = document.createElement("li");
        const createFolderButton = createButton("dropdown-item", "Add folder", function () { createFolder(collectionObj.name, collections) });
        const createRequestButton = createButton("dropdown-item", "Add request", function () { createRequest(collectionObj.name) });
        const deleteCollectionButton = createButton("dropdown-item", "Delete collection", function () { deleteCollection(collectionObj.name, collections) });

        collectionDetailsElement.open = collectionObj.open || false;
        collectionSummaryElement.innerText = collectionObj.name;
        collectionSummaryElement.classList = "fw-bold p-2";
        collectionDropdownMenu.classList = "dropdown-menu";

        collectionDetailsElement.addEventListener("toggle", () => {

            const index = collections.findIndex(collection => collection.name === collectionObj.name);
            collections[index].open = collectionDetailsElement.open;
            saveInLocalStorage(settings.collectionskey, collections);
        });

        const collectionRequests = collectionObj.requests || [];
        renderRequests(collectionRequests, collectionObj, null, collectionDetailsElement);

        const collectionFolders = collectionObj.folders || [];
        renderFolders(collectionFolders, collectionDetailsElement, collectionObj, collections);

        createFolderItem.appendChild(createFolderButton);
        createRequestItem.appendChild(createRequestButton);
        deleteCollectionItem.appendChild(deleteCollectionButton);
        collectionDropdownButton.appendChild(collectionDropdownIcon);
        collectionDropdownMenu.appendChild(createRequestItem);
        collectionDropdownMenu.appendChild(createFolderItem);
        collectionDropdownMenu.appendChild(deleteCollectionItem);
        collectionDropdownDiv.appendChild(collectionDropdownButton);
        collectionDropdownDiv.appendChild(collectionDropdownMenu);
        collectionSummaryElement.appendChild(collectionDropdownDiv);
        collectionDetailsElement.appendChild(collectionSummaryElement);
        requestsDiv.appendChild(collectionDetailsElement);
    };
};

function renderFolders(collectionFolders, parentElement, collectionObj, collections) {

    for (const folderObj of collectionFolders) {

        const folderDetailsElement = document.createElement("details");
        const folderSummaryElement = document.createElement("summary");
        const folderDropdownDiv = createDiv("dropdown");
        const folderDropdownIcon = createIcon("fas fa-ellipsis-h");
        const folderDropdownButton = createButton("btn btn-sm btn-secondary dropdown-toggle", "", null, { type: "button", "data-bs-toggle": "dropdown", "aria-expanded": "false" });
        const folderDropdownMenu = document.createElement("ul");
        const createRequestItem = document.createElement("li");
        const deleteFolderItem = document.createElement("li");

        const createRequestButton = createButton("dropdown-item", "Add request", function () { createRequest(collectionObj.name, folderObj.name) });
        const deleteFolderButton = createButton("dropdown-item", "Delete folder", function () { deleteFolder(collectionObj.name, folderObj.name, collections) });

        folderDetailsElement.open = folderObj.open || false;
        folderSummaryElement.innerText = folderObj.name;
        folderSummaryElement.classList = "fw-bold p-2";
        folderDropdownMenu.classList = "dropdown-menu";

        folderDetailsElement.addEventListener("toggle", () => {
            const collectionIndex = collections.findIndex(collection => collection.name === collectionObj.name);
            const folderIndex = collections[collectionIndex].folders.findIndex(folder => folder.name === folderObj.name);
            collections[collectionIndex].folders[folderIndex].open = folderDetailsElement.open;
            saveInLocalStorage(settings.collectionskey, collections);
        });

        const folderRequests = folderObj.requests || [];
        renderRequests(folderRequests, collectionObj, folderObj, folderDetailsElement);

        createRequestItem.appendChild(createRequestButton);
        deleteFolderItem.appendChild(deleteFolderButton);
        folderDropdownButton.appendChild(folderDropdownIcon);
        folderDropdownMenu.appendChild(createRequestItem);
        folderDropdownMenu.appendChild(deleteFolderItem);
        folderDropdownDiv.appendChild(folderDropdownButton);
        folderDropdownDiv.appendChild(folderDropdownMenu);
        folderSummaryElement.appendChild(folderDropdownDiv);
        folderDetailsElement.appendChild(folderSummaryElement);
        parentElement.appendChild(folderDetailsElement);
    };
};

function renderRequests(requests, collectionObj, folderObj, parentElement) {

    for (const singleRequest of requests) {

        const buttonDiv = createDiv("d-flex");
        const methodText = singleRequest.object.method;
        const methodTextElement = document.createElement("span");
        methodTextElement.classList.add("pe-2");
        methodTextElement.innerText = methodText.toUpperCase();

        const requestNameElement = document.createElement("span");
        requestNameElement.innerText = singleRequest.name;

        const methodClasses = {

            get: 'text-success',
            post: 'text-warning',
            put: 'text-primary',
            patch: 'text-info',
            delete: 'text-danger'
        };

        const methodClass = methodClasses[methodText.toLowerCase()] || 'text-secondary';

        if (settings.supportedMethods.includes(methodText.toUpperCase())) {

            methodTextElement.classList.add(methodClass);
        } else {

            methodTextElement.classList.add('text-secondary');
        }

        const requestButton = createButton("btn btn-sm btn-dark flex-grow-1", "", function () { loadRequestPreview(collectionObj, folderObj, singleRequest) });

        const deleteButton = createButton("btn btn-sm btn-danger", createIcon("fas fa-trash"), function () { deleteRequest(collectionObj.name, folderObj?.name, singleRequest.name, getFromLocalStorage(settings.collectionskey)) });

        requestButton.appendChild(methodTextElement);
        requestButton.appendChild(requestNameElement);
        buttonDiv.appendChild(requestButton);
        buttonDiv.appendChild(deleteButton);
        parentElement.appendChild(buttonDiv);
    };
};

function loadRequestPreview(collectionObj, folderObj = null, requestObj) {

    requestPreviewDiv.innerHTML = "";

    const breadcrumbPath = folderObj === null ? `${collectionObj.name} / ${requestObj.name}` : `${collectionObj.name} / ${folderObj.name} / ${requestObj.name}`;
    const breadcrumb = createDiv("p-2 my-3 d-flex justify-content-between align-items-center border");
    const breadcrumbText = document.createElement("p");
    breadcrumbText.className = "m-0";
    breadcrumbText.innerText = breadcrumbPath;
    const saveButton = createButton("btn btn-sm btn-primary", "Save", null, { disabled: true });

    breadcrumb.appendChild(breadcrumbText);
    breadcrumb.appendChild(saveButton);

    const route = createDiv("input-group mb-3");

    const methodSelect = document.createElement("select");
    methodSelect.className = "form-select";
    methodSelect.style.maxWidth = "9%";

    for (const method of settings.supportedMethods) {

        const option = document.createElement("option");
        option.value = method.toLowerCase();
        option.innerText = method;

        if (method.toLowerCase() === requestObj.object.method.toLowerCase()) { option.selected = true };

        methodSelect.appendChild(option);
    };

    methodSelect.addEventListener("input", (event) => { updateRequestValue() });

    const routeInput = document.createElement("input");
    routeInput.type = "text";
    routeInput.className = "form-control";
    routeInput.value = requestObj.object.url || "";

    routeInput.addEventListener("input", (event) => { updateRequestValue() });

    const actionButton = createButton("btn btn-outline-primary", "Send", function () { sendRequest(requestObj) });

    route.appendChild(methodSelect);
    route.appendChild(routeInput);
    route.appendChild(actionButton);

    requestPreviewDiv.appendChild(breadcrumb);
    requestPreviewDiv.appendChild(route);

    function updateRequestValue() {

        saveButton.disabled = false;

        saveButton.addEventListener("click", () => {

            let collections = getFromLocalStorage(settings.collectionskey);
            const newMethod = methodSelect.value;
            const newUrl = routeInput.value;

            requestObj.object.url = newUrl;
            requestObj.object.method = newMethod;

            saveRequest(collections, collectionObj.name, folderObj === null ? folderObj : folderObj.name, requestObj);
            loadRequests();
            saveButton.disabled = true;
        });
    };
};

function deleteCollection(collectionName, collections) {

    const index = collections.findIndex(collection => collection.name === collectionName);

    if (index !== -1) {

        const ok = confirm(`Delete "${collections[index].name}"?
This will delete everything inside it.`);

        if (ok) {

            collections.splice(index, 1);
            saveInLocalStorage(settings.collectionskey, collections);
            renderCollections(collections);
        };
    };
};

function deleteFolder(collectionName, folderName, collections) {

    const collectionIndex = collections.findIndex(collection => collection.name === collectionName);
    const folderIndex = collections[collectionIndex].folders.findIndex(folder => folder.name === folderName);

    if (folderIndex !== -1) {

        const ok = confirm(`Delete "${collections[collectionIndex].folders[folderIndex].name}"?
Are you sure you want to delete ${collections[collectionIndex].folders[folderIndex].name}?`);

        if (ok) {

            collections[collectionIndex].folders.splice(folderIndex, 1);
            saveInLocalStorage(settings.collectionskey, collections);
            renderCollections(collections);
        };
    };
};

function deleteRequest(collectionName, folderName, requestName, collections) {

    const collection = collections.find(collection => collection.name === collectionName);
    const requests = folderName ? collection.folders.find(folder => folder.name === folderName).requests : collection.requests;
    const requestIndex = requests.findIndex(request => request.name === requestName);

    if (requestIndex !== -1 && confirm(`Delete request "${requests[requestIndex].name}"?`)) {

        requests.splice(requestIndex, 1);
        saveInLocalStorage(settings.collectionskey, collections);
        renderCollections(collections);
    }
};

function promptForInput(message, isBody = false, isOptional = false) {

    let input = prompt(message);
    const fieldName = message.match(/Enter (.*?)[:?]/)[1];

    if (!input && !isOptional) {

        alert(`${fieldName} is required!`);
        return promptForInput(message, isBody, isOptional);
    };

    if (isBody) {

        try {

            return JSON.parse(input.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"'));
        } catch (error) {

            alert("Invalid JSON format. Please try again.");
            return promptForInput(message, isBody, isOptional);
        };
    };

    return input;
};

function createButton(classes, content, onClick, attributes = {}) {

    const button = document.createElement("button");
    button.classList = classes;
    button.append(content);
    button.onclick = onClick;

    for (const [key, value] of Object.entries(attributes)) {

        button.setAttribute(key, value);
    };

    return button;
};

function createDiv(classes, content = "", attributes = {}) {

    const div = document.createElement("div");
    div.classList = classes;
    div.append(content);

    for (const [key, value] of Object.entries(attributes)) {

        div.setAttribute(key, value);
    };

    return div;
};

function createIcon(classes) {

    const icon = document.createElement("i");
    icon.classList = classes;
    return icon;
};

function sendRequest(requestObj) {

    const config = {

        method: requestObj.object.method,
        url: requestObj.object.url,
        headers: {

            "x-api-key": settings.backendApiKey,
            ...requestObj.object.headers
        },
        data: requestObj.object.data || {}
    };

    axios(config)

        .then(response => {

            console.log("Request successful:", response);
            displayResponse(response.data);
        })
        .catch(error => {

            console.error("Error making request:", error);
            displayResponse(error.response ? error.response.data : error.message, true);
        });
};

function displayResponse(responseData, isError = false) {

    const previousResponse = requestPreviewDiv.querySelector('.response');

    if (previousResponse) { previousResponse.remove() };

    const preElement = document.createElement("pre");
    preElement.className = "prettyprint p-3 mt-3 response";
    preElement.style.borderColor = isError ? 'red' : 'darkseagreen';
    preElement.append(JSON.stringify(responseData, null, 2));
    requestPreviewDiv.appendChild(preElement);
    prettyPrint();
};

function saveInLocalStorage(key, value) {

    if (value !== undefined && value !== null) {

        localStorage.setItem(key, JSON.stringify(value));
    };
};

function getFromLocalStorage(key) {

    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
};

function importCollections() {

    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (file && file.type === 'application/json') {

        const reader = new FileReader();

        reader.onload = function (event) {

            try {

                const data = JSON.parse(event.target.result);
                saveInLocalStorage(settings.collectionskey, data);
                loadRequests();
                hideImportModal();
            } catch (error) {

                alert('Error parsing JSON file. Please ensure it is valid JSON.');
            };
        };

        reader.readAsText(file);
    } else {

        alert('Please upload a valid JSON file.');
    };
};

function exportCollections() {

    const collections = getFromLocalStorage(settings.collectionskey);
    const blob = new Blob([JSON.stringify(collections)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collections.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function showImportModal() { importModal.show() };

function hideImportModal() { importModal.hide() };

document.getElementById('importCollections').addEventListener('hidden.bs.modal', event => {

    document.getElementById("importFile").value = "";
    document.getElementById("importFile").files = undefined;
});