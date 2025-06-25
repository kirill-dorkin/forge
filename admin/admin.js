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
  a.onclick = e => { e.preventDefault(); load(name); };
  li.appendChild(a);
  tabs.appendChild(li);
});

async function api(method, url, data){
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type':'application/json' },
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

function readFileAsDataURL(file){
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

function renderList(name, items){
  content.innerHTML = '';
  const addForm = document.createElement('form');
  addForm.className = 'mb-4';
  addForm.innerHTML = formFields(name);
  addForm.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(addForm);
    const obj = {};
    for(const [k,v] of fd.entries()){
      if(v instanceof File && v.size){
        obj[k+'Data'] = await readFileAsDataURL(v);
      } else {
        obj[k] = v;
      }
    }
    await api('POST', `/api/${name}`, obj);
    load(name);
  };
  content.appendChild(addForm);

  const table = document.createElement('table');
  table.className = 'table table-striped';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const fields = items.length ? Object.keys(items[0]) : [];
  fields.forEach(f=>{
    const th=document.createElement('th');
    th.textContent=f;
    headerRow.appendChild(th);
  });
  headerRow.appendChild(document.createElement('th'));
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  items.forEach(item=>{
    const tr=document.createElement('tr');
    fields.forEach(f=>{
      const td=document.createElement('td');
      if(f==='image'){
        const img=document.createElement('img');
        img.src='/' + item[f];
        img.style.height='50px';
        td.appendChild(img);
      } else {
        td.textContent=item[f];
      }
      tr.appendChild(td);
    });
    const tdDel=document.createElement('td');
    const del=document.createElement('button');
    del.className='btn btn-sm btn-danger';
    del.textContent='Удалить';
    del.onclick=async()=>{await api('DELETE', `/api/${name}/${item.id}`); load(name);};
    tdDel.appendChild(del);
    tr.appendChild(tdDel);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  content.appendChild(table);
}

function formFields(name){
  switch(name){
    case 'services':
      return '<input name="name" placeholder="Название" class="form-control mb-2" required>'+
             '<textarea name="description" placeholder="Описание" class="form-control mb-2" required></textarea>'+
             '<input name="icon" placeholder="Иконка" class="form-control mb-2">'+
             '<button class="btn btn-primary">Добавить</button>';
    case 'portfolio':
      return '<input name="title" placeholder="Заголовок" class="form-control mb-2" required>'+
             '<input name="category" placeholder="Категория" class="form-control mb-2">'+
             '<input type="file" name="image" class="form-control mb-2" accept="image/*">'+
             '<button class="btn btn-primary">Добавить</button>';
    case 'about':
      return '<input name="year" placeholder="Год" class="form-control mb-2" required>'+
             '<input name="title" placeholder="Заголовок" class="form-control mb-2" required>'+
             '<textarea name="description" placeholder="Описание" class="form-control mb-2" required></textarea>'+
             '<input type="file" name="image" class="form-control mb-2" accept="image/*">'+
             '<button class="btn btn-primary">Добавить</button>';
    case 'team':
      return '<input name="name" placeholder="Имя" class="form-control mb-2" required>'+
             '<input name="role" placeholder="Роль" class="form-control mb-2" required>'+
             '<input type="file" name="image" class="form-control mb-2" accept="image/*">'+
             '<button class="btn btn-primary">Добавить</button>';
  }
}

load('services');
