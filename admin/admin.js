const datasets = ['services','portfolio','about','team'];
const tabs = document.getElementById('tabs');
const content = document.getElementById('content');

datasets.forEach(name => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = '#';
    a.textContent = name;
    a.onclick = (e) => {e.preventDefault(); load(name);};
    li.appendChild(a);
    tabs.appendChild(li);
});

async function api(method, url, data){
    const res = await fetch(url, {
        method,
        headers: {'Content-Type':'application/json'},
        body: data ? JSON.stringify(data) : undefined
    });
    return res.ok ? res.json() : Promise.reject(res.statusText);
}

async function load(name){
    tabs.querySelectorAll('.nav-link').forEach(l=>{
        if(l.textContent===name) l.classList.add('active');
        else l.classList.remove('active');
    });
    const items = await api('GET', `/api/${name}`);
    renderList(name, items);
}

function renderList(name, items){
    content.innerHTML = '';
    const addForm = document.createElement('form');
    addForm.innerHTML = formFields(name);
    addForm.onsubmit = async (e)=>{
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(addForm));
        await api('POST', `/api/${name}`, formData);
        load(name);
    };
    content.appendChild(addForm);
    const list = document.createElement('ul');
    list.className = 'list-group mt-3';
    items.forEach(item=>{
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = JSON.stringify(item);
        const del = document.createElement('button');
        del.className = 'btn btn-sm btn-danger';
        del.textContent = 'Удалить';
        del.onclick = async ()=>{await api('DELETE', `/api/${name}/${item.id}`); load(name);};
        li.appendChild(del);
        list.appendChild(li);
    });
    content.appendChild(list);
}

function formFields(name){
    switch(name){
        case 'services':
            return '<input name="name" placeholder="Название" class="form-control mb-2" required><textarea name="description" placeholder="Описание" class="form-control mb-2" required></textarea><input name="icon" placeholder="Иконка" class="form-control mb-2"><button class="btn btn-primary">Добавить</button>';
        case 'portfolio':
            return '<input name="title" placeholder="Заголовок" class="form-control mb-2" required><input name="category" placeholder="Категория" class="form-control mb-2"><input name="image" placeholder="Путь к изображению" class="form-control mb-2"><button class="btn btn-primary">Добавить</button>';
        case 'about':
            return '<input name="year" placeholder="Год" class="form-control mb-2" required><input name="title" placeholder="Заголовок" class="form-control mb-2" required><textarea name="description" placeholder="Описание" class="form-control mb-2" required></textarea><input name="image" placeholder="Путь к изображению" class="form-control mb-2"><button class="btn btn-primary">Добавить</button>';
        case 'team':
            return '<input name="name" placeholder="Имя" class="form-control mb-2" required><input name="role" placeholder="Роль" class="form-control mb-2" required><input name="image" placeholder="Путь к изображению" class="form-control mb-2"><button class="btn btn-primary">Добавить</button>';
    }
}

load('services');
