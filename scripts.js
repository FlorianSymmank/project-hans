const SUPABASE_URL = 'https://nehlaaelcbmntddqngzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGxhYWVsY2JtbnRkZHFuZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzE3OTAsImV4cCI6MjA3NTQwNzc5MH0.JKK9YTCcj2eEV_QtQYconkfPC4YjDUHU6cRwar41Z1w';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let deleteIdeaId = null;
let filterTimeout = null;
let showArchivedIdeas = false;

// Initialize
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        showApp(session.user);
    }
});

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        showApp(session.user);
    } else {
        showAuth();
    }
});

// Load theme preference
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    updateThemeIcon();
}

// Auth functions
async function signIn(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showToast('Fehler beim Anmelden: ' + error.message, 'danger');
    }
}

async function signOut() {
    await supabase.auth.signOut();
}

function showApp(user) {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('app-section').classList.remove('d-none');
    document.getElementById('user-email').textContent = user.email;
    loadIdeas();
    loadPopularTags();
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('app-section').classList.add('d-none');
}

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle i');
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

// Toast notifications
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();

    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';

    const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Idea CRUD operations
async function saveIdea(event) {
    event.preventDefault();
    const name = document.getElementById('idea-name').value;
    const description = document.getElementById('idea-description').value;
    const tagsInput = document.getElementById('idea-tags').value;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const archived = document.getElementById('idea-archived').checked;
    const editId = document.getElementById('edit-idea-id').value;

    const { data: { user } } = await supabase.auth.getUser();

    if (editId) {
        // Update existing idea
        const { error } = await supabase
            .from('ideas')
            .update({ name, description, tags, archived })
            .eq('id', editId);

        if (error) {
            showToast('Fehler beim Aktualisieren der Idee: ' + error.message, 'danger');
        } else {
            showToast('Idee erfolgreich aktualisiert!', 'success');
            cancelEdit();
            loadIdeas();
            loadPopularTags();
        }
    } else {
        // Create new idea
        const { error } = await supabase
            .from('ideas')
            .insert([{ name, description, tags, archived, user_id: user.id }]);

        if (error) {
            showToast('Fehler beim Hinzufügen der Idee: ' + error.message, 'danger');
        } else {
            showToast('Idee erfolgreich hinzugefügt!', 'success');
            document.getElementById('idea-form').reset();
            loadIdeas();
            loadPopularTags();
        }
    }
}

function editIdea(id, name, description, tags, archived) {
    document.getElementById('edit-idea-id').value = id;
    document.getElementById('idea-name').value = name;
    document.getElementById('idea-description').value = description || '';
    document.getElementById('idea-tags').value = tags.join(', ');
    document.getElementById('idea-archived').checked = archived || false;

    document.getElementById('form-title').textContent = 'Edit Idea';
    document.getElementById('save-button-text').textContent = 'Update Idea';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';

    const collapseElement = document.getElementById('addIdeaCollapse');

    // Prüfen ob bereits offen
    if (!collapseElement.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(collapseElement, { show: true });
    }

    // Smooth scroll zum Formular
    setTimeout(() => {
        collapseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

async function editIdeaById(id) {
    const { data: idea, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Fehler beim Laden der Idee: ' + error.message, 'danger');
        return;
    }

    editIdea(idea.id, idea.name, idea.description, idea.tags, idea.archived);
}

function cancelEdit() {
    document.getElementById('idea-form').reset();
    document.getElementById('edit-idea-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Idea';
    document.getElementById('save-button-text').textContent = 'Add Idea';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

async function loadIdeas(filterTags = null) {
    let query = supabase.from('ideas').select('*').order('created_at', { ascending: false });

    if (!showArchivedIdeas) {
        query = query.or('archived.is.null,archived.eq.false');
    }

    if (filterTags && filterTags.length > 0) {
        filterTags.forEach(tag => {
            query = query.contains('tags', [tag]);
        });
    }

    const { data: ideas, error } = await query;

    if (error) {
        showToast('Fehler beim Laden der Ideen: ' + error.message, 'danger');
        return;
    }

    displayIdeas(ideas, filterTags);
}

async function loadPopularTags() {
    const { data: ideas, error } = await supabase.from('ideas').select('tags');

    if (error) {
        console.error('Fehler beim Laden der Tags:', error);
        return;
    }

    const tagCount = {};
    ideas.forEach(idea => {
        idea.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));

    displayPopularTags(sortedTags);
}

function displayPopularTags(tags) {
    const container = document.getElementById('popular-tags');

    if (tags.length === 0) {
        container.innerHTML = '<small class="text-muted">Noch keine Tags vorhanden</small>';
        return;
    }

    const activeFilters = document.getElementById('filter-tag').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

    container.innerHTML = tags.map(({ tag, count }) => {
        const isActive = activeFilters.includes(tag);
        const badgeClass = isActive ? 'bg-success' : 'bg-primary';

        return `
    <span class="badge ${badgeClass} me-2 mb-2" role="button" onclick="filterByTag('${tag}')" style="cursor: pointer; font-size: 14px;">
        ${tag} <span class="badge bg-light text-dark">${count}</span>
    </span>
    `;
    }).join('');
}

function filterByTag(tag) {
    const filterInput = document.getElementById('filter-tag');
    const currentTags = filterInput.value.split(',').map(t => t.trim()).filter(t => t);

    const tagIndex = currentTags.indexOf(tag);
    if (tagIndex > -1) {
        currentTags.splice(tagIndex, 1);
    } else {
        currentTags.push(tag);
    }

    filterInput.value = currentTags.join(', ');

    if (currentTags.length === 0) {
        showAllIdeas();
    } else {
        filterIdeas();
    }
}

function displayIdeas(ideas, filterTags = null) {
    const container = document.getElementById('ideas-list');

    if (ideas.length === 0) {
        if (filterTags && filterTags.length > 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> Keine Ideen entsprechen Ihrem Filter.
                    <button class="btn btn-link p-0" onclick="showAllIdeas()">Filter zurücksetzen</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-lightbulb"></i> Noch keine Ideen. Fügen Sie Ihre erste Idee hinzu!
                </div>
            `;
        }
        return;
    }

    container.innerHTML = ideas.map(idea => {
        const archivedClass = idea.archived ? 'opacity-75' : '';
        const archivedBadge = idea.archived ? '<span class="badge bg-success me-2">Completed</span>' : '';

        return `
    <div class="card shadow-sm mb-3 ${archivedClass}">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h5 class="card-title">
                        ${archivedBadge}
                        ${idea.name}
                    </h5>
                    <p class="card-text text-muted">${idea.description || 'No description'}</p>
                    <div class="mb-2">
                        ${idea.tags.map(tag => `<span class="badge bg-secondary me-1" role="button" onclick="filterByTag('${tag}')" style="cursor: pointer;">${tag}</span>`).join('')}
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> ${new Date(idea.created_at).toLocaleDateString()}
                    </small>
                </div>
                <div class="d-flex flex-column gap-2">
                    <button onclick="editIdeaById('${idea.id}')" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="deleteIdea('${idea.id}', '${idea.name.replace(/'/g, "\\'")}')" class="btn btn-outline-danger btn-sm">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    </div>
</div>
`;
    }).join('');
}



function deleteIdea(id, name) {
    deleteIdeaId = id;
    document.getElementById('delete-idea-name').textContent = name;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    const { error } = await supabase.from('ideas').delete().eq('id', deleteIdeaId);

    if (error) {
        showToast('Fehler beim Löschen der Idee: ' + error.message, 'danger');
    } else {
        showToast('Idee erfolgreich gelöscht!', 'success');
        loadIdeas();
        loadPopularTags();
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
}

// Filter functions
function debounceFilter() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        filterIdeas();
    }, 500);
}

function filterIdeas() {
    const tagsInput = document.getElementById('filter-tag').value.trim();
    if (tagsInput) {
        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
        loadIdeas(tags);
        loadPopularTags();
    } else {
        loadIdeas();
    }
}

function showAllIdeas() {
    document.getElementById('filter-tag').value = '';
    loadIdeas();
    loadPopularTags();
}

function toggleArchived() {
    showArchivedIdeas = document.getElementById('show-archived').checked;
    loadIdeas();
}

// Export functions
async function exportIdeas() {
    const modal = new bootstrap.Modal(document.getElementById('exportModal'));
    modal.show();
}

async function exportFormat(format) {
    const { data: ideas, error } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });

    if (error) {
        showToast('Fehler beim Exportieren der Ideen: ' + error.message, 'danger');
        return;
    }

    if (format === 'json') {
        exportAsJSON(ideas);
    } else {
        exportAsCSV(ideas);
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
    modal.hide();
}

function exportAsJSON(ideas) {
    const dataStr = JSON.stringify(ideas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    downloadFile(dataBlob, 'ideas.json');
    showToast('Ideen erfolgreich als JSON exportiert!', 'success');
}

function exportAsCSV(ideas) {
    const headers = ['Name', 'Beschreibung', 'Tags', 'Archiviert', 'Erstellt am'];
    const rows = ideas.map(idea => [
        idea.name,
        (idea.description || '').replace(/\r?\n/g, ' '),
        idea.tags.join('; '),
        idea.archived ? 'True' : 'False',
        new Date(idea.created_at).toLocaleString()
    ]);

    const escapeCSV = (cell) => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"')) {
            return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
    };

    const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(dataBlob, 'ideas.csv');
    showToast('Ideen erfolgreich als CSV exportiert!', 'success');
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}