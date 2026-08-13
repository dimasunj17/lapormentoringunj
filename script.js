// ==========================================
// 1. ISIKAN URL DAN ANON KEY SUPABASE ANDA
// ==========================================
const SUPABASE_URL = "https://bovkynryjqxskypgvnim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdmt5bnJ5anF4c2t5cGd2bmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNzQzOTEsImV4cCI6MjEwMDk1MDM5MX0.BuEN0Op4wnsO2cnpEWtsRpWz-OCBEKcJVDkHmvkugpc";

// Inisialisasi Supabase Client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE MANAGEMENT ---
let currentUserData = null;
let reports = [];
let modules = [];
let usersList = [];
let currentFilteredReports = [];
let currentReportAttendees = [];
let keterlaksanaanChartInstance = null;
let isPasswordRecoveryMode = typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery');

// --- DOM ELEMENTS ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');

// Forms Auth
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-form');
const resetPasswordForm = document.getElementById('reset-password-form');

// Navigasi Auth
const linkToRegister = document.getElementById('link-to-register');
const linkToLoginFromReg = document.getElementById('link-to-login-from-reg');
const linkToForgot = document.getElementById('link-to-forgot');
const linkToLoginFromForgot = document.getElementById('link-to-login-from-forgot');
const linkToLoginFromReset = document.getElementById('link-to-login-from-reset');
const btnLogout = document.getElementById('btn-logout');

// Top Navbar Details
const displayUserName = document.getElementById('display-user-name');
const displayUserRole = document.getElementById('display-user-role');

// Tabs
const tabReportsBtn = document.getElementById('tab-reports-btn');
const tabModulesBtn = document.getElementById('tab-modules-btn');
const tabUsersBtn = document.getElementById('tab-users-btn');

const viewReports = document.getElementById('view-reports');
const viewModules = document.getElementById('view-modules');
const viewUsers = document.getElementById('view-users');
const thUserAction = document.getElementById('th-user-action');

// Mentoring Elements
const tableBody = document.getElementById('report-table-body');
const userTableBody = document.getElementById('user-table-body');
const mentoringForm = document.getElementById('mentoring-form');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const searchInput = document.getElementById('search-input');
const btnAdd = document.getElementById('btn-add');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnExportExcel = document.getElementById('btn-export-excel');

// Presensi & Preset Elements
const inputNewMember = document.getElementById('input-new-member');
const btnAddMemberList = document.getElementById('btn-add-member-list');
const membersChecklistContainer = document.getElementById('members-checklist-container');
const displayAutoCount = document.getElementById('display-auto-count');
const btnLoadPresetMembers = document.getElementById('btn-load-preset-members');
const btnSaveAsPreset = document.getElementById('btn-save-as-preset');

// Modul Elements
const btnAddModule = document.getElementById('btn-add-module');
const modalModuleOverlay = document.getElementById('modal-module-overlay');
const btnCloseModuleModal = document.getElementById('btn-close-module-modal');
const moduleForm = document.getElementById('module-form');
const modulesContainer = document.getElementById('modules-container');
const searchModuleInput = document.getElementById('search-module-input');

// Metrics
const statTotalMentors = document.getElementById('stat-total-mentors');
const statTotalMembers = document.getElementById('stat-total-members');
const statTotalMaterials = document.getElementById('stat-total-materials');

// Chart Elements
const chartRangeFilter = document.getElementById('chart-range-filter');
const chartGroupFilter = document.getElementById('chart-group-filter');

// --- HELPER FUNCTIONS ---
function escapeHtml(str) { 
    return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : ''; 
}

function openModal(title = 'Tambah Laporan Mentoring') { 
    if (modalTitle) modalTitle.textContent = title; 
    if (modalOverlay) modalOverlay.classList.add('active'); 
}

function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
    if (mentoringForm) mentoringForm.reset();
    
    const reportIdInput = document.getElementById('report-id');
    if (reportIdInput) reportIdInput.value = '';
    
    currentReportAttendees = [];
    renderAttendeesChecklist();
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    checkSession();
});

// --- AUTHENTICATION & SESSION MANAGEMENT ---
async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    const isRecovery = isPasswordRecoveryMode || (window.location.hash && window.location.hash.includes('type=recovery'));

    if (session && !isRecovery) {
        const { data: profile } = await _supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            currentUserData = profile;
            displayUserName.textContent = profile.name;
            displayUserRole.textContent = `${profile.role} ${profile.fakultas ? '(' + profile.fakultas + ')' : ''}`;

            authSection.style.display = 'none';
            appSection.classList.remove('app-hidden');

            applyRolePermissions();
            loadAllData();
        }
    } else if (isRecovery) {
        // Alur Reset Password -> Sembunyikan Dashboard, Tampilkan Form Reset Password Halaman Utama
        currentUserData = null;
        authSection.style.display = 'flex';
        appSection.classList.add('app-hidden');
        showAuthForm(resetPasswordForm);
    } else {
        currentUserData = null;
        authSection.style.display = 'flex';
        appSection.classList.add('app-hidden');
        showAuthForm(loginForm);
    }
}


if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(registerForm); });
if (linkToLoginFromReg) linkToLoginFromReg.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(loginForm); });
if (linkToForgot) linkToForgot.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(forgotForm); });
if (linkToLoginFromForgot) linkToLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(loginForm); });
if (linkToLoginFromReset) {
    linkToLoginFromReset.addEventListener('click', async (e) => {
        e.preventDefault();
        isPasswordRecoveryMode = false;
        await _supabase.auth.signOut();
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, window.location.pathname);
        }
        checkSession();
    });
}

function showAuthForm(targetForm) {
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    forgotForm.classList.remove('active');
    if (resetPasswordForm) resetPasswordForm.classList.remove('active');
    if (targetForm) targetForm.classList.add('active');
}

// CONFIGURASI TOKEN REGISTRASI ROLE KHUSUS
const ROLE_REGISTRATION_TOKENS = {
    'Admin Super': 'SUPER2026',
    'Pengelola': 'PENGELOLA2026',
    'Viewer': 'VIEWER2026'
};

// TOGGLE DISPLAY INPUT TOKEN BERDASARKAN ROLE
const regRoleSelect = document.getElementById('reg-role');
const groupRegToken = document.getElementById('group-reg-token');

if (regRoleSelect && groupRegToken) {
    regRoleSelect.addEventListener('change', () => {
        const selectedRole = regRoleSelect.value;
        if (ROLE_REGISTRATION_TOKENS[selectedRole]) {
            groupRegToken.style.display = 'block';
        } else {
            groupRegToken.style.display = 'none';
            const inputToken = document.getElementById('reg-token');
            if (inputToken) inputToken.value = '';
        }
    });
}

// REGISTRASI AKUN (DENGAN FAKULTAS & TOKEN OTORISASI)
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit-reg');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Mendaftarkan...";

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const role = document.getElementById('reg-role').value;
        const fakultas = document.getElementById('reg-fakultas').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validasi Token Otorisasi Role Khusus
        if (ROLE_REGISTRATION_TOKENS[role]) {
            const inputToken = (document.getElementById('reg-token')?.value || '').trim();
            if (!inputToken || inputToken !== ROLE_REGISTRATION_TOKENS[role]) {
                alert(`Gagal Registrasi! Kode token otorisasi untuk role [${role}] salah atau tidak diisi. Silakan minta kode token resmi ke Admin Utama.`);
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Daftar Akun";
                return;
            }
        }

        if (password !== confirmPassword) {
            alert('Password dan Konfirmasi Password tidak cocok!');
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Daftar Akun";
            return;
        }

        try {
            const { data: authData, error: authError } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { name: name, role: role, fakultas: fakultas } }
            });

            if (authError) throw authError;

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                alert('Email ini sudah terdaftar! Silakan langsung login atau reset password.');
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Daftar Akun";
                return;
            }

            if (authData.user) {
                await _supabase.from('profiles').upsert([
                    { id: authData.user.id, name: name, email: email, role: role, fakultas: fakultas }
                ], { onConflict: 'id' });
            }

            alert(`Registrasi berhasil! Akun dibuat sebagai [${role}] di [${fakultas}]. Silakan login.`);
            registerForm.reset();
            if (groupRegToken) groupRegToken.style.display = 'none';
            showAuthForm(loginForm);

        } catch (err) {
            alert('Gagal Registrasi: ' + err.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Daftar Akun";
        }
    });
}

// LOGIN
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit-login');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Memeriksa...";

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const { error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            loginForm.reset();
            checkSession();
        } catch (err) {
            alert('Login Gagal! Email atau password salah.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Masuk";
        }
    });
}

// TOGGLE LIHAT/SEMBUNYIKAN PASSWORD
const toggleLoginPassword = document.getElementById('toggle-login-password');
const loginPasswordInput = document.getElementById('login-password');

if (toggleLoginPassword && loginPasswordInput) {
    toggleLoginPassword.addEventListener('click', () => {
        const isPassword = loginPasswordInput.getAttribute('type') === 'password';
        loginPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleLoginPassword.classList.toggle('fa-eye', !isPassword);
        toggleLoginPassword.classList.toggle('fa-eye-slash', isPassword);
    });
}

// LOGOUT
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (confirm('Keluar dari sistem?')) {
            await _supabase.auth.signOut();
            checkSession();
        }
    });
}

// RESET PASSWORD
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();

        try {
            const { error } = await _supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            alert('Link reset password telah dikirim ke email Anda.');
            showAuthForm(loginForm);
        } catch (err) {
            alert('Gagal: ' + err.message);
        }
    });
}

// ==========================================================================
// TARUH KODE UNTUK UPDATE PASSWORD BARU TEPAT DI SINI (BARU):
// ==========================================================================

// 1. Deteksi saat user membuka web dari Link Email Reset Password
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY' || isPasswordRecoveryMode || (window.location.hash && window.location.hash.includes('type=recovery'))) {
        isPasswordRecoveryMode = true;
        authSection.style.display = 'flex';
        appSection.classList.add('app-hidden');
        showAuthForm(resetPasswordForm);
    }
});

// 2. Toggle Lihat/Sembunyikan Password Baru
const toggleNewPassword = document.getElementById('toggle-new-password');
const newPasswordInput = document.getElementById('new-password');

if (toggleNewPassword && newPasswordInput) {
    toggleNewPassword.addEventListener('click', () => {
        const isPassword = newPasswordInput.getAttribute('type') === 'password';
        newPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleNewPassword.classList.toggle('fa-eye', !isPassword);
        toggleNewPassword.classList.toggle('fa-eye-slash', isPassword);
    });
}

// 3. Kirim Password Baru yang Diinput User ke Supabase
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit-update-pwd');
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (newPassword.length < 6) {
            return alert('Password baru minimal 6 karakter!');
        }

        if (newPassword !== confirmNewPassword) {
            return alert('Password baru dan konfirmasi password tidak cocok!');
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Updating...";

        try {
            const { error } = await _supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            alert('Password berhasil diperbarui! Silakan gunakan password baru ini untuk login.');
            
            isPasswordRecoveryMode = false;

            // Log out temporary recovery session so user logs in cleanly with new password
            await _supabase.auth.signOut();
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, null, window.location.pathname);
            }
            
            resetPasswordForm.reset();
            checkSession();

        } catch (err) {
            alert('Gagal memperbarui password: ' + err.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Simpan Password Baru";
        }
    });
}
// ==========================================================================

// PERMISSIONS CONTROL
function applyRolePermissions() {
    const isViewer = currentUserData.role === 'Viewer';
    const isAdminSuper = currentUserData.role === 'Admin Super';
    const isPengelola = currentUserData.role === 'Pengelola';

    document.querySelectorAll('.role-write-only').forEach(el => {
        el.style.display = isViewer ? 'none' : '';
    });

    document.querySelectorAll('.role-manager-only').forEach(el => {
        el.style.display = (isAdminSuper || isPengelola) ? '' : 'none';
    });

    if (isAdminSuper || isPengelola) {
        tabUsersBtn.style.display = '';
    } else {
        tabUsersBtn.style.display = 'none';
        switchTab('reports');
    }
}

// TABS NAVIGATION
if (tabReportsBtn) tabReportsBtn.addEventListener('click', () => switchTab('reports'));
if (tabModulesBtn) tabModulesBtn.addEventListener('click', () => switchTab('modules'));
if (tabUsersBtn) tabUsersBtn.addEventListener('click', () => switchTab('users'));

function switchTab(tab) {
    [tabReportsBtn, tabModulesBtn, tabUsersBtn].forEach(b => b && b.classList.remove('active'));
    [viewReports, viewModules, viewUsers].forEach(v => v && v.classList.remove('active'));

    if (tab === 'reports') {
        if (tabReportsBtn) tabReportsBtn.classList.add('active');
        if (viewReports) viewReports.classList.add('active');
    } else if (tab === 'modules') {
        if (tabModulesBtn) tabModulesBtn.classList.add('active');
        if (viewModules) viewModules.classList.add('active');
    } else if (tab === 'users') {
        if (tabUsersBtn) tabUsersBtn.classList.add('active');
        if (viewUsers) viewUsers.classList.add('active');
    }
}

// --- LOAD ALL DATA (DENGAN MULTITENANCY FAKULTAS) ---
async function loadAllData() {
    try {
        let query = _supabase.from('reports').select('*');

        // 1. JIKA ROLE MENTOR: Hanya ambil laporannya sendiri
        if (currentUserData && currentUserData.role === 'Mentor') {
            query = query.eq('user_id', currentUserData.id);
        } 
        // 2. JIKA ROLE PENGELOLA ATAU VIEWER (PIMPINAN) FAKULTAS: Saring khusus dari fakultasnya
        else if (currentUserData && (currentUserData.role === 'Pengelola' || currentUserData.role === 'Viewer') && currentUserData.fakultas && currentUserData.fakultas !== 'Semua Fakultas (Pusat)') {
            query = query.ilike('fakultas', `%${currentUserData.fakultas}%`);
        }

        const { data: reportsData, error: reportsError } = await query.order('created_at', { ascending: false });

        if (reportsError) throw reportsError;

        reports = reportsData || [];
        
        renderTable();
        updateDashboard();
        renderKeterlaksanaanChart();

        // Load Modul
        if (typeof renderModules === 'function') {
            const { data: modulesData } = await _supabase.from('modules').select('*').order('created_at', { ascending: false });
            modules = modulesData || [];
            renderModules();
        }

        // Load Users
        if (currentUserData && (currentUserData.role === 'Admin Super' || currentUserData.role === 'Pengelola')) {
            let userQuery = _supabase.from('profiles').select('*');
            if (currentUserData.role === 'Pengelola' && currentUserData.fakultas) {
                userQuery = userQuery.ilike('fakultas', `%${currentUserData.fakultas}%`);
            }
            const { data: profilesData } = await userQuery;
            usersList = profilesData || [];
            if (typeof renderUserTable === 'function') renderUserTable();
        }
    } catch (err) {
        console.error('Error loadAllData:', err.message);
    }
}

// --- PRESENSI ANGGOTA DINAMIS & PRESET KELOMPOK BINAAN ---
if (btnLoadPresetMembers) btnLoadPresetMembers.addEventListener('click', () => loadPresetMembersToForm(true));
if (btnSaveAsPreset) btnSaveAsPreset.addEventListener('click', saveCurrentMembersAsPreset);

if (btnAddMemberList) btnAddMemberList.addEventListener('click', addMemberToChecklist);
if (inputNewMember) {
    inputNewMember.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMemberToChecklist();
        }
    });
}

function addMemberToChecklist() {
    if (!inputNewMember) return;
    const name = inputNewMember.value.trim();
    if (!name) return;

    if (currentReportAttendees.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        alert('Nama anggota tersebut sudah ada di daftar!');
        return;
    }

    currentReportAttendees.push({ name: name, isPresent: true });
    inputNewMember.value = '';
    renderAttendeesChecklist();
}

function renderAttendeesChecklist() {
    if (!membersChecklistContainer) return;
    membersChecklistContainer.innerHTML = '';

    if (currentReportAttendees.length === 0) {
        membersChecklistContainer.innerHTML = `
            <p id="empty-members-msg" style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin: 0.5rem 0;">
                Belum ada anggota ditambahkan. Klik tombol "Muat Kelompok Saya" di atas untuk memuat daftar otomatis.
            </p>
        `;
        updateAttendanceCount();
        return;
    }

    currentReportAttendees.forEach((member, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 0.4rem;';

        itemDiv.innerHTML = `
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin: 0; font-size: 0.9rem; flex: 1;">
                <input type="checkbox" ${member.isPresent ? 'checked' : ''} onchange="window.toggleAttendance(${index})">
                <span style="${member.isPresent ? 'font-weight: 600;' : 'color: #94a3b8; text-decoration: line-through;'}">${escapeHtml(member.name)}</span>
            </label>
            <button type="button" class="btn-action btn-delete" onclick="window.removeMemberFromChecklist(${index})" title="Hapus Anggota" style="font-size: 0.85rem;">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        membersChecklistContainer.appendChild(itemDiv);
    });

    updateAttendanceCount();
}

window.toggleAttendance = function(index) {
    currentReportAttendees[index].isPresent = !currentReportAttendees[index].isPresent;
    renderAttendeesChecklist();
};

window.removeMemberFromChecklist = function(index) {
    currentReportAttendees.splice(index, 1);
    renderAttendeesChecklist();
};

function updateAttendanceCount() {
    if (!displayAutoCount) return;
    const presentCount = currentReportAttendees.filter(m => m.isPresent).length;
    displayAutoCount.textContent = `Total Hadir: ${presentCount} Orang`;
}

// LOGIKA KELOMPOK BINAAN TETAP (PRESET)
function loadPresetMembersToForm(showAlertIfEmpty = false) {
    if (currentUserData && Array.isArray(currentUserData.group_members) && currentUserData.group_members.length > 0) {
        currentReportAttendees = currentUserData.group_members.map(name => ({
            name: typeof name === 'object' ? name.name : name,
            isPresent: true
        }));
        renderAttendeesChecklist();
    } else {
        if (showAlertIfEmpty) {
            alert('Anda belum menyimpan Kelompok Binaan Tetap. Silakan tambahkan nama-nama anggota Anda, lalu klik "Simpan daftar di atas sebagai Kelompok Binaan Tetap saya".');
        }
    }
}

async function saveCurrentMembersAsPreset() {
    if (!currentUserData || !currentUserData.id) return alert('Sesi berakhir!');
    if (currentReportAttendees.length === 0) return alert('Tambahkan minimal 1 nama anggota terlebih dahulu!');

    const memberNames = currentReportAttendees.map(m => m.name);

    try {
        const { error } = await _supabase
            .from('profiles')
            .update({ group_members: memberNames })
            .eq('id', currentUserData.id);

        if (error) throw error;

        currentUserData.group_members = memberNames;
        alert('Daftar anggota berhasil disimpan sebagai Kelompok Binaan Tetap Anda!');
    } catch (err) {
        alert('Gagal menyimpan kelompok tetap: ' + err.message);
    }
}

// --- CRUD LAPORAN MENTORING ---
if (btnAdd) {
    btnAdd.addEventListener('click', () => {
        currentReportAttendees = [];
        
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0].substring(0, 5);
        if (document.getElementById('mentoring-date')) document.getElementById('mentoring-date').value = today;
        if (document.getElementById('mentoring-time')) document.getElementById('mentoring-time').value = now;

        // Prepopulate Nama Mentor & Fakultas sesuai user yang sedang login
        if (currentUserData) {
            const mentorNameInput = document.getElementById('mentor-name');
            if (mentorNameInput) mentorNameInput.value = currentUserData.name || '';

            const fakultasSelect = document.getElementById('fakultas');
            if (fakultasSelect && currentUserData.fakultas) {
                setSelectFakultasValue(fakultasSelect, currentUserData.fakultas);
            }
        }

        // Auto Load Anggota Tetap Jika Ada
        loadPresetMembersToForm();

        openModal('Tambah Laporan Mentoring');
    });
}

if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (mentoringForm) mentoringForm.addEventListener('submit', handleFormSubmit);
if (searchInput) searchInput.addEventListener('input', handleSearch);

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentUserData || !currentUserData.id) return alert('Sesi Anda telah berakhir. Silakan login kembali.');
    if (!Array.isArray(currentReportAttendees) || currentReportAttendees.length === 0) {
        return alert('Silakan tambahkan minimal 1 nama anggota binaan di bagian ceklis terlebih dahulu!');
    }

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalBtnText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Menyimpan...";

    const id = document.getElementById('report-id').value;
    const presentMembersCount = currentReportAttendees.filter(m => m.isPresent).length;

    const reportData = {
        mentor_name: document.getElementById('mentor-name').value.trim(),
        mentoring_date: document.getElementById('mentoring-date').value,
        mentoring_time: document.getElementById('mentoring-time').value,
        location: document.getElementById('location').value.trim(),
        member_count: presentMembersCount,
        attendees: currentReportAttendees,
        fakultas: document.getElementById('fakultas').value.trim(),
        prodi: document.getElementById('prodi').value.trim(),
        angkatan: document.getElementById('angkatan').value.trim(),
        materi: document.getElementById('materi').value.trim(),
        user_id: currentUserData.id
    };

    try {
        if (id) {
            const { error } = await _supabase.from('reports').update(reportData).eq('id', id);
            if (error) throw error;
            alert('Laporan berhasil diperbarui!');
        } else {
            const { error } = await _supabase.from('reports').insert([reportData]);
            if (error) throw error;
            alert('Laporan berhasil disimpan!');
        }

        closeModal();
        await loadAllData();
    } catch (err) {
        console.error('Error simpan laporan:', err);
        alert('Gagal menyimpan laporan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalBtnText;
    }
}

// RENDER TABEL
function renderTable(dataToRender = reports) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const isViewer = currentUserData && currentUserData.role === 'Viewer';

    if (!dataToRender || dataToRender.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${isViewer ? '6' : '7'}" style="text-align: center; color: var(--text-muted);">Belum ada data laporan.</td></tr>`;
        return;
    }

    dataToRender.forEach((item) => {
        let dateFormatted = '-';
        if (item.mentoring_date) {
            try {
                dateFormatted = new Date(item.mentoring_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) {
                dateFormatted = item.mentoring_date;
            }
        }

        const timeFormatted = item.mentoring_time ? item.mentoring_time.substring(0, 5) + ' WIB' : '';
        const dateTimeText = timeFormatted ? `${dateFormatted}, ${timeFormatted}` : dateFormatted;
        const locationText = item.location || 'Lokasi belum diisi';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(item.mentor_name || '-')}</strong></td>
            <td>
                <div style="font-size: 0.9rem; font-weight: 500;">
                    <i class="fa-regular fa-calendar-days" style="color: var(--primary-color);"></i> ${escapeHtml(dateTimeText)}
                </div>
                <small style="color: var(--text-muted); display: block; margin-top: 2px;">
                    <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${escapeHtml(locationText)}
                </small>
            </td>
            <td><i class="fa-solid fa-user-group"></i> ${item.member_count || 0} Orang</td>
            <td>
                <div>${escapeHtml(item.prodi || '-')}</div>
                <small style="color: var(--text-muted);">${escapeHtml(item.fakultas || '-')}</small>
            </td>
            <td><span class="badge-angkatan">${escapeHtml(item.angkatan || '-')}</span></td>
            <td><div class="materi-preview" title="${escapeHtml(item.materi || '')}">${escapeHtml(item.materi || '-')}</div></td>
            ${isViewer ? '' : `
            <td>
                <button type="button" class="btn-action btn-edit" onclick="window.editReport('${item.id}')" title="Edit Laporan">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="btn-action btn-delete" onclick="window.deleteReport('${item.id}')" title="Hapus Laporan">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
            `}
        `;
        tableBody.appendChild(row);
    });
}

// EDIT LAPORAN
window.editReport = function(id) {
    const report = reports.find(r => String(r.id) === String(id));
    if (!report) return alert('Data laporan tidak ditemukan!');

    document.getElementById('report-id').value = report.id;
    document.getElementById('mentor-name').value = report.mentor_name || '';
    document.getElementById('mentoring-date').value = report.mentoring_date || '';
    document.getElementById('mentoring-time').value = report.mentoring_time || '';
    document.getElementById('location').value = report.location || '';
    
    const fakultasSelect = document.getElementById('fakultas');
    if (fakultasSelect) {
        setSelectFakultasValue(fakultasSelect, report.fakultas || '');
    }

    document.getElementById('prodi').value = report.prodi || '';
    document.getElementById('angkatan').value = report.angkatan || '';
    document.getElementById('materi').value = report.materi || '';

    currentReportAttendees = Array.isArray(report.attendees) ? [...report.attendees] : [];
    renderAttendeesChecklist();

    openModal('Edit Laporan Mentoring');
};

// HAPUS LAPORAN
window.deleteReport = async function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
        try {
            const { error } = await _supabase.from('reports').delete().eq('id', id);
            if (error) throw error;
            loadAllData();
        } catch (err) {
            alert('Gagal menghapus: ' + err.message);
        }
    }
};

function updateDashboard() {
    // 1. Total Sesi Mentoring
    if (statTotalMentors) statTotalMentors.textContent = reports.length;

    // 2. Total Anggota Terbina (Menghitung Nama Unik / Tidak Diakumulasikan Per Sesi)
    const uniqueMembers = new Set();

    reports.forEach(r => {
        // Jika ada data array nama anggota (attendees)
        if (Array.isArray(r.attendees) && r.attendees.length > 0) {
            r.attendees.forEach(m => {
                const memberName = typeof m === 'object' ? m.name : m;
                if (memberName) {
                    uniqueMembers.add(memberName.trim().toLowerCase());
                }
            });
        }
    });

    // Tampilkan jumlah unik nama anggota (jika belum ada detail nama, gunakan estimasi fallback)
    if (statTotalMembers) {
        statTotalMembers.textContent = uniqueMembers.size > 0 ? uniqueMembers.size : 0;
    }

    // 3. Total Materi Unik
    const uniqueMaterials = new Set(reports.map(r => (r.materi || '').trim().toLowerCase()).filter(Boolean)).size;
    if (statTotalMaterials) statTotalMaterials.textContent = uniqueMaterials;
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    currentFilteredReports = reports.filter(r => 
        (r.mentor_name || '').toLowerCase().includes(query) ||
        (r.fakultas || '').toLowerCase().includes(query) ||
        (r.prodi || '').toLowerCase().includes(query) ||
        (r.angkatan || '').toString().includes(query) ||
        (r.materi || '').toLowerCase().includes(query)
    );
    renderTable(currentFilteredReports);
}

const btnCancelModule = document.getElementById('btn-cancel-module');

function closeModuleModal() {
    if (modalModuleOverlay) modalModuleOverlay.classList.remove('active');
    if (moduleForm) moduleForm.reset();
}

if (btnAddModule) btnAddModule.addEventListener('click', () => modalModuleOverlay.classList.add('active'));
if (btnCloseModuleModal) btnCloseModuleModal.addEventListener('click', closeModuleModal);
if (btnCancelModule) btnCancelModule.addEventListener('click', closeModuleModal);
if (searchModuleInput) searchModuleInput.addEventListener('input', handleSearchModule);

if (moduleForm) {
    moduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('module-file');
        if (fileInput.files.length === 0) return alert('Pilih file terlebih dahulu!');

        const file = fileInput.files[0];
        const btnSubmit = moduleForm.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit ? btnSubmit.textContent : 'Simpan Modul';

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Mengunggah File...';
        }

        try {
            // 1. Sanitisasi & Susun Nama File Unik di Storage Bucket
            const timestamp = Date.now();
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `modules/${timestamp}_${cleanFileName}`;

            // 2. Unggah File ke Supabase Storage Bucket 'modules'
            const { data: storageData, error: storageError } = await _supabase.storage
                .from('modules')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (storageError) {
                // Berikan petunjuk yang jelas jika Bucket 'modules' belum dibuat di Dashboard Supabase
                if (storageError.message && (storageError.message.includes('not found') || storageError.message.includes('Bucket') || storageError.statusCode === "404")) {
                    throw new Error('Bucket "modules" belum dibuat di Supabase Dashboard! Silakan buat Bucket bernama "modules" dan centang "Public Bucket".');
                }
                throw storageError;
            }

            // 3. Dapatkan URL Publik File dari Storage
            const { data: publicUrlData } = _supabase.storage.from('modules').getPublicUrl(filePath);
            const publicUrl = publicUrlData ? publicUrlData.publicUrl : '';

            // 4. Simpan Metadata Modul ke Tabel 'modules' Database
            const modulePayload = {
                title: document.getElementById('module-title').value.trim(),
                target: document.getElementById('module-target').value.trim(),
                description: document.getElementById('module-desc').value.trim(),
                file_name: file.name,
                file_data: publicUrl,
                file_url: publicUrl,
                file_path: filePath,
                uploader: currentUserData ? currentUserData.name : 'Pengelola'
            };

            const { error: dbError } = await _supabase.from('modules').insert([modulePayload]);
            if (dbError) {
                if (dbError.message && (dbError.message.includes('file_path') || dbError.message.includes('file_url'))) {
                    throw new Error('Kolom "file_path" belum dibuat di tabel "modules" Supabase! Silakan jalankan perintah SQL berikut di Supabase SQL Editor:\n\nALTER TABLE modules ADD COLUMN IF NOT EXISTS file_url TEXT, ADD COLUMN IF NOT EXISTS file_path TEXT;');
                }
                throw dbError;
            }

            moduleForm.reset();
            modalModuleOverlay.classList.remove('active');
            alert('Modul berhasil diunggah!');
            loadAllData();

        } catch (err) {
            console.error('Error upload modul:', err);
            alert('Gagal upload modul: ' + err.message);
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalBtnText;
            }
        }
    });
}

function renderModules(dataToRender = modules) {
    if (!modulesContainer) return;
    modulesContainer.innerHTML = '';
    if (dataToRender.length === 0) {
        modulesContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Belum ada modul di-upload.</p>`;
        return;
    }

    const isManagerOrAdmin = currentUserData && (currentUserData.role === 'Admin Super' || currentUserData.role === 'Pengelola');

    dataToRender.forEach(mod => {
        // Kompatibilitas Mundur: Gunakan file_url jika ada, jika modul lama gunakan file_data (Base64)
        const downloadUrl = mod.file_url || mod.file_data || '#';
        const isStorageUrl = Boolean(mod.file_url);

        const card = document.createElement('div');
        card.className = 'module-card';
        card.innerHTML = `
            <div>
                <div class="module-icon"><i class="fa-solid fa-file-pdf"></i></div>
                <div class="module-title">${escapeHtml(mod.title)}</div>
                <div class="module-meta"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(mod.target)} | <i class="fa-solid fa-user"></i> ${escapeHtml(mod.uploader)}</div>
                <div class="module-desc">${escapeHtml(mod.description || 'Tidak ada deskripsi.')}</div>
            </div>
            <div class="module-actions">
                <a href="${downloadUrl}" ${isStorageUrl ? 'target="_blank"' : ''} download="${escapeHtml(mod.file_name)}" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;"><i class="fa-solid fa-download"></i> Unduh File</a>
                ${isManagerOrAdmin ? `<button class="btn-action btn-delete" onclick="window.deleteModule('${mod.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        `;
        modulesContainer.appendChild(card);
    });
}

window.deleteModule = async function(id) {
    const mod = modules.find(m => String(m.id) === String(id));
    if (!confirm('Apakah Anda yakin ingin menghapus modul ini?')) return;

    try {
        // 1. Jika modul disimpan di Storage Bucket (punya file_path), hapus filenya dari Supabase Storage
        if (mod && mod.file_path) {
            const { error: storageDelError } = await _supabase.storage.from('modules').remove([mod.file_path]);
            if (storageDelError) console.warn('Peringatan: Gagal menghapus file dari storage:', storageDelError.message);
        }

        // 2. Hapus data baris dari tabel 'modules' Database
        const { error } = await _supabase.from('modules').delete().eq('id', id);
        if (error) throw error;

        alert('Modul berhasil dihapus!');
        loadAllData();
    } catch (err) {
        alert('Gagal menghapus modul: ' + err.message);
    }
};

function handleSearchModule(e) {
    const query = e.target.value.toLowerCase();
    const filtered = modules.filter(m => 
        (m.title || '').toLowerCase().includes(query) ||
        (m.target || '').toLowerCase().includes(query) ||
        (m.uploader || '').toLowerCase().includes(query)
    );
    renderModules(filtered);
}

// --- USER MANAGEMENT ---
function renderUserTable() {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';
    const isAdminSuper = currentUserData && currentUserData.role === 'Admin Super';
    if (thUserAction) thUserAction.style.display = isAdminSuper ? '' : 'none';

    usersList.forEach(user => {
        const row = document.createElement('tr');
        const isSelf = user.id === currentUserData.id;

        row.innerHTML = `
            <td><strong>${escapeHtml(user.name)}</strong> ${isSelf ? '<small>(Anda)</small>' : ''}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge-role">${user.role} ${user.fakultas ? '(' + user.fakultas + ')' : ''}</span></td>
            ${isAdminSuper ? `
            <td>
                ${isSelf ? '-' : `
                    <select onchange="window.changeUserRole('${user.id}', this.value)" style="padding: 0.3rem;">
                        <option value="Mentor" ${user.role === 'Mentor' ? 'selected' : ''}>Mentor</option>
                        <option value="Pengelola" ${user.role === 'Pengelola' ? 'selected' : ''}>Pengelola</option>
                        <option value="Viewer" ${user.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
                        <option value="Admin Super" ${user.role === 'Admin Super' ? 'selected' : ''}>Admin Super</option>
                    </select>
                `}
            </td>
            ` : ''}
        `;
        userTableBody.appendChild(row);
    });
}

window.changeUserRole = async function(userId, newRole) {
    if (currentUserData.role !== 'Admin Super') return alert('Hanya Admin Super yang dapat mengubah hak akses!');
    try {
        const { error } = await _supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) throw error;
        alert('Role user berhasil diperbarui!');
        loadAllData();
    } catch (err) {
        alert('Gagal mengubah role: ' + err.message);
    }
};

// --- EXPORT TO EXCEL (LENGKAP DENGAN DAFTAR NAMA ANGGOTA) ---
if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
        const dataToExport = currentFilteredReports.length > 0 ? currentFilteredReports : reports;
        if (dataToExport.length === 0) return alert('Tidak ada data laporan untuk diekspor!');

        const excelData = dataToExport.map((item, index) => {
            // 1. Ekstrak & Format Daftar Nama Anggota dari Array Attendees
            let daftarAnggotaHadir = '-';
            let daftarAnggotaAbsen = '-';

            if (Array.isArray(item.attendees) && item.attendees.length > 0) {
                // Ambil anggota yang Hadir
                const hadirList = item.attendees
                    .filter(m => m.isPresent)
                    .map(m => typeof m === 'object' ? m.name : m);
                if (hadirList.length > 0) daftarAnggotaHadir = hadirList.join(', ');

                // Ambil anggota yang Tidak Hadir / Absen
                const absenList = item.attendees
                    .filter(m => !m.isPresent)
                    .map(m => typeof m === 'object' ? m.name : m);
                if (absenList.length > 0) daftarAnggotaAbsen = absenList.join(', ');
            }

            // 2. Susun Struktur Baris Excel
            return {
                "No": index + 1,
                "Nama Mentor": item.mentor_name || '-',
                "Tanggal Mentoring": item.mentoring_date || '-',
                "Waktu": item.mentoring_time || '-',
                "Tempat / Lokasi": item.location || '-',
                "Fakultas": item.fakultas || '-',
                "Program Studi": item.prodi || '-',
                "Angkatan": item.angkatan || '-',
                "Jumlah Hadir": item.member_count || 0,
                "Daftar Anggota Hadir": daftarAnggotaHadir, // <-- KOLOM NAMA ANGGOTA HADIR
                "Daftar Anggota Tidak Hadir": daftarAnggotaAbsen, // <-- KOLOM NAMA ANGGOTA ABSEN
                "Materi Disampaikan": item.materi || '-'
            };
        });

        // 3. Generate & Download File Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Atur lebar kolom otomatis agar tulisan nama rapi
        worksheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 22 }, // Mentor
            { wch: 15 }, // Tanggal
            { wch: 10 }, // Waktu
            { wch: 20 }, // Lokasi
            { wch: 12 }, // Fakultas
            { wch: 22 }, // Prodi
            { wch: 10 }, // Angkatan
            { wch: 12 }, // Jml Hadir
            { wch: 40 }, // Nama Hadir
            { wch: 30 }, // Nama Absen
            { wch: 35 }  // Materi
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Mentoring");
        XLSX.writeFile(workbook, `Rekap_Laporan_Mentoring_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
}

// --- GRAFIK KETERLAKSANAAN MENTORING (CHART.JS) ---
if (chartRangeFilter && chartGroupFilter) {
    chartRangeFilter.addEventListener('change', renderKeterlaksanaanChart);
    chartGroupFilter.addEventListener('change', renderKeterlaksanaanChart);
}

function renderKeterlaksanaanChart() {
    const canvas = document.getElementById('keterlaksanaanChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const range = chartRangeFilter ? chartRangeFilter.value : '6M';
    const group = chartGroupFilter ? chartGroupFilter.value : 'monthly';

    const now = new Date();
    let startDate = new Date();

    if (range === '1M') {
        startDate.setMonth(now.getMonth() - 1);
    } else if (range === '6M') {
        startDate.setMonth(now.getMonth() - 6);
    } else if (range === '1Y') {
        startDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredReports = reports.filter(r => {
        if (!r.mentoring_date) return false;
        const rDate = new Date(r.mentoring_date);
        return rDate >= startDate && rDate <= now;
    });

    const groupedData = {};

    filteredReports.forEach(r => {
        const date = new Date(r.mentoring_date);
        let key = '';

        if (group === 'monthly') {
            key = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        } else {
            const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const weekNo = Math.ceil((((date - firstDayOfMonth) / 86400000) + firstDayOfMonth.getDay() + 1) / 7);
            const monthLabel = date.toLocaleDateString('id-ID', { month: 'short' });
            key = `Pekan ${weekNo} (${monthLabel})`;
        }

        if (!groupedData[key]) {
            groupedData[key] = { totalSesi: 0, totalHadir: 0 };
        }

        groupedData[key].totalSesi += 1;
        groupedData[key].totalHadir += (parseInt(r.member_count) || 0);
    });

    const labels = Object.keys(groupedData);
    const datasetSesi = labels.map(k => groupedData[k].totalSesi);
    const datasetHadir = labels.map(k => groupedData[k].totalHadir);

    if (keterlaksanaanChartInstance) {
        keterlaksanaanChartInstance.destroy();
    }

    keterlaksanaanChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Belum Ada Data'],
            datasets: [
                {
                    label: 'Total Sesi Mentoring',
                    data: datasetSesi.length > 0 ? datasetSesi : [0],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Total Anggota Hadir',
                    data: datasetHadir.length > 0 ? datasetHadir : [0],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

// ==========================================================================
// --- MANAJEMEN & EDIT PROFIL PENGGUNA ---
// ==========================================================================

const btnOpenProfile = document.getElementById('btn-open-profile');
const btnCloseProfile = document.getElementById('btn-close-profile');
const modalUserProfile = document.getElementById('modal-user-profile');

const profileViewMode = document.getElementById('profile-view-mode');
const editProfileForm = document.getElementById('edit-profile-form');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnCancelEditProfile = document.getElementById('btn-cancel-edit-profile');

if (btnOpenProfile) btnOpenProfile.addEventListener('click', showUserProfileModal);
if (btnCloseProfile) btnCloseProfile.addEventListener('click', closeModalProfile);

// Helper function untuk mencocokkan & memilih option Fakultas di dropdown secara otomatis
function setSelectFakultasValue(selectElem, targetVal) {
    if (!selectElem || !targetVal) return;
    
    let rawTarget = targetVal.trim();
    let cleanTarget = rawTarget.toLowerCase();

    // Pemetaan alias akurat dari berbagai variasi nama/kode ke Option Value yang sesuai
    const aliasToValue = {
        'fe': 'FE',
        'fakultas ekonomi': 'FE',
        'fakultas ekonomi (fe)': 'FE',
        'ekonomi': 'FE',
        'feb': 'FEB',
        'fakultas ekonomika dan bisnis': 'FEB',
        'fakultas ekonomika dan bisnis (feb)': 'FEB',
        'fakultas ekonomika & bisnis': 'FEB',
        'ft': 'FT',
        'fakultas teknik': 'FT',
        'fbs': 'FBS',
        'fakultas bahasa dan seni': 'FBS',
        'fmipa': 'FMIPA',
        'fakultas matematika dan ipa': 'FMIPA',
        'fakultas mipa': 'FMIPA',
        'mipa': 'FMIPA',
        'fip': 'FIP',
        'fakultas ilmu pendidikan': 'FIP',
        'fish': 'FISH',
        'fis': 'FISH',
        'fakultas ilmu sosial dan hukum': 'FISH',
        'fakultas ilmu sosial': 'FISH',
        'fikk': 'FIKK',
        'fik': 'FIKK',
        'fakultas ilmu keolahragaan dan kesehatan': 'FIKK',
        'fakultas keolahragaan': 'FIKK',
        'psikologi': 'Psikologi',
        'fpsi': 'Psikologi',
        'fakultas psikologi': 'Psikologi',
        'semua fakultas (pusat)': 'Semua Fakultas (Pusat)',
        'semua fakultas': 'Semua Fakultas (Pusat)',
        'pusat': 'Semua Fakultas (Pusat)'
    };

    // 1. Coba pencocokan langsung dari pemetaan alias
    let matchedValue = aliasToValue[cleanTarget];
    
    if (!matchedValue) {
        // Coba bersihkan kata 'fakultas' (contoh: "Fakultas FEB" -> "feb")
        const withoutFakultas = cleanTarget.replace(/fakultas/gi, '').trim();
        if (aliasToValue[withoutFakultas]) {
            matchedValue = aliasToValue[withoutFakultas];
        }
    }

    // 2. Jika ketemu nilai terpetakan, pilih option yang memiliki value tersebut
    if (matchedValue) {
        for (let i = 0; i < selectElem.options.length; i++) {
            if (selectElem.options[i].value === matchedValue) {
                selectElem.selectedIndex = i;
                return;
            }
        }
    }

    // 3. Exact match terhadap option value atau text
    for (let i = 0; i < selectElem.options.length; i++) {
        const opt = selectElem.options[i];
        const optVal = opt.value.trim().toLowerCase();
        const optText = opt.text.trim().toLowerCase();

        if (optVal === cleanTarget || optText === cleanTarget) {
            selectElem.selectedIndex = i;
            return;
        }
    }

    // 4. Pencocokan kata kunci/kode persis (misal: "FEB" atau "FT" di dalam teks target)
    for (let i = 0; i < selectElem.options.length; i++) {
        const optVal = selectElem.options[i].value;
        if (optVal && optVal !== 'Semua Fakultas (Pusat)') {
            const regex = new RegExp(`\\b${optVal}\\b`, 'i');
            if (regex.test(rawTarget)) {
                selectElem.selectedIndex = i;
                return;
            }
        }
    }
}

function openEditProfileMode() {
    const currentName = document.getElementById('profile-name')?.textContent || '';
    const currentEmail = document.getElementById('profile-email')?.textContent || '';
    const currentFakultas = document.getElementById('profile-fakultas')?.textContent || '';

    const nameInput = document.getElementById('edit-profile-name');
    const emailInput = document.getElementById('edit-profile-email');
    const fakultasSelect = document.getElementById('edit-profile-fakultas');
    const passInput = document.getElementById('edit-profile-password');

    const nameVal = (typeof currentUserData !== 'undefined' && currentUserData && currentUserData.name) ? currentUserData.name : currentName;
    const emailVal = (typeof currentUserData !== 'undefined' && currentUserData && currentUserData.email) ? currentUserData.email : currentEmail;
    const fakVal = (typeof currentUserData !== 'undefined' && currentUserData && currentUserData.fakultas) ? currentUserData.fakultas : currentFakultas;

    if (nameInput) nameInput.value = nameVal;
    if (emailInput) emailInput.value = emailVal;
    if (passInput) passInput.value = '';

    if (fakultasSelect) {
        setSelectFakultasValue(fakultasSelect, fakVal);
    }

    if (profileViewMode) profileViewMode.style.display = 'none';
    if (editProfileForm) editProfileForm.style.display = 'block';
}

document.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('#btn-edit-profile') || 
                    (e.target.textContent && e.target.textContent.includes('Edit Profil') && e.target.closest('#modal-user-profile'));

    if (btnEdit) {
        e.preventDefault();
        openEditProfileMode();
    }

    const btnCancel = e.target.closest('#btn-cancel-edit-profile');
    if (btnCancel) {
        e.preventDefault();
        if (editProfileForm) editProfileForm.style.display = 'none';
        if (profileViewMode) profileViewMode.style.display = 'block';
    }

    const btnClose = e.target.closest('#btn-close-profile');
    if (btnClose) {
        e.preventDefault();
        closeModalProfile();
    }
});

function closeModalProfile() {
    if (modalUserProfile) modalUserProfile.style.display = 'none';
    if (editProfileForm) editProfileForm.style.display = 'none';
    if (profileViewMode) profileViewMode.style.display = 'block';
}

function showUserProfileModal() {
    if (!currentUserData) return alert('Data pengguna tidak ditemukan!');

    // Reset ke View Mode saat dibuka
    if (editProfileForm) editProfileForm.style.display = 'none';
    if (profileViewMode) profileViewMode.style.display = 'block';

    // 1. Inisial Avatar
    const firstLetter = currentUserData.name ? currentUserData.name.charAt(0).toUpperCase() : 'U';
    const profileAvatar = document.getElementById('profile-avatar');
    const navAvatar = document.getElementById('nav-avatar');
    
    if (profileAvatar) profileAvatar.textContent = firstLetter;
    if (navAvatar) navAvatar.textContent = firstLetter;

    // 2. Data Dasar
    document.getElementById('profile-name').textContent = currentUserData.name || '-';
    document.getElementById('profile-email').textContent = currentUserData.email || '-';
    document.getElementById('profile-fakultas').textContent = currentUserData.fakultas || 'Semua Fakultas (Pusat)';
    document.getElementById('profile-role-badge').textContent = currentUserData.role || 'User';

    // 3. Penyesuaian Detail Berdasarkan Role
    const profileScope = document.getElementById('profile-scope');
    const mentorSection = document.getElementById('profile-mentor-section');

    if (currentUserData.role === 'Mentor') {
        if (profileScope) profileScope.textContent = 'Khusus Kelompok Binaan Sendiri';
        if (mentorSection) mentorSection.style.display = 'block';

        const groupMembers = currentUserData.group_members || [];
        const countElem = document.getElementById('profile-group-count');
        if (countElem) countElem.textContent = groupMembers.length;
        
        const groupListContainer = document.getElementById('profile-group-list');
        if (groupListContainer) {
            if (groupMembers.length > 0) {
                groupListContainer.innerHTML = groupMembers.map((m, idx) => `
                    <div style="padding: 2px 0;">${idx + 1}. ${escapeHtml(typeof m === 'object' ? m.name : m)}</div>
                `).join('');
            } else {
                groupListContainer.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Belum menyimpan Kelompok Binaan Tetap.</span>';
            }
        }

    } else if (currentUserData.role === 'Pengelola') {
        if (profileScope) profileScope.textContent = `Pengelola Tingkat ${currentUserData.fakultas || 'Fakultas'}`;
        if (mentorSection) mentorSection.style.display = 'none';

    } else if (currentUserData.role === 'Viewer') {
        const isPusat = !currentUserData.fakultas || currentUserData.fakultas === 'Semua Fakultas (Pusat)';
        if (profileScope) profileScope.textContent = isPusat ? 'Monitoring Data Se-Universitas (Read-Only)' : `Monitoring Pimpinan Tingkat ${currentUserData.fakultas} (Read-Only)`;
        if (mentorSection) mentorSection.style.display = 'none';

    } else if (currentUserData.role === 'Admin Super') {
        if (profileScope) profileScope.textContent = 'Akses Penuh Seluruh Sistem & User';
        if (mentorSection) mentorSection.style.display = 'none';
    }

    if (modalUserProfile) modalUserProfile.style.display = 'flex';
}

// SIMPAN PERUBAHAN PROFIL KE DATABASE SUPABASE
if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-profile');
        const newName = document.getElementById('edit-profile-name')?.value.trim();
        const newEmail = document.getElementById('edit-profile-email')?.value.trim();
        const newFakultas = document.getElementById('edit-profile-fakultas')?.value;
        const newPassword = document.getElementById('edit-profile-password')?.value;

        if (!newName || !newEmail) return alert('Nama dan Email tidak boleh kosong!');

        if (btnSave) {
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';
        }

        try {
            // 1. Update Nama, Email & Fakultas di Tabel 'profiles' Supabase
            if (typeof _supabase !== 'undefined' && currentUserData && currentUserData.id) {
                const { error: profileError } = await _supabase
                    .from('profiles')
                    .update({ 
                        name: newName,
                        email: newEmail,
                        fakultas: newFakultas
                    })
                    .eq('id', currentUserData.id);

                if (profileError) throw profileError;

                // 2. Jika Email Berubah, Update Email di Supabase Auth
                if (newEmail !== currentUserData.email) {
                    const { error: authEmailError } = await _supabase.auth.updateUser({ email: newEmail });
                    if (authEmailError) throw authEmailError;
                }

                // 3. Jika Password Diisi, Update Password di Supabase Auth
                if (newPassword) {
                    if (newPassword.length < 6) throw new Error('Password minimal 6 karakter!');
                    const { error: pwdError } = await _supabase.auth.updateUser({ password: newPassword });
                    if (pwdError) throw pwdError;
                }
            }

            // 4. Update Local State UI
            if (currentUserData) {
                currentUserData.name = newName;
                currentUserData.email = newEmail;
                currentUserData.fakultas = newFakultas;
            }

            const displayUserName = document.getElementById('display-user-name');
            const displayUserRole = document.getElementById('display-user-role');
            if (displayUserName) displayUserName.textContent = newName;
            if (displayUserRole && currentUserData) {
                displayUserRole.textContent = `${currentUserData.role} ${currentUserData.fakultas ? '(' + currentUserData.fakultas + ')' : ''}`;
            }
            
            const firstLetter = newName.charAt(0).toUpperCase();
            const navAvatar = document.getElementById('nav-avatar');
            if (navAvatar) navAvatar.textContent = firstLetter;

            alert('Profil berhasil diperbarui!');
            showUserProfileModal(); // Refresh isi modal profil

        } catch (err) {
            alert('Gagal memperbarui profil: ' + err.message);
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.textContent = 'Simpan Perubahan';
            }
        }
    });
}