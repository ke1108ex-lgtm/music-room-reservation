const STORAGE_KEYS = {
  admins: 'music_admins_v1',
  bands: 'music_bands_v1',
  users: 'music_users_v1',
  bookings: 'music_bookings_v1',
  settings: 'music_settings_v1',
  sessionUser: 'music_session_user_v1',
  sessionAdmin: 'music_session_admin_v1',
  adminId: 'music_session_admin_id'
};

const DEFAULT_ADMIN = { id: 'T225107', password: 'APTAPT' };
const DEFAULT_BANDS = ['Sunset Echo', 'Midnight Pulse', 'Velvet Noise'];
const DEFAULT_SETTINGS = {
  start: '09:00',
  end: '20:00',
  unit: '60',
  dailySlots: 12
};

const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const userScreen = document.getElementById('user-screen');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const userLoginForm = document.getElementById('user-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const registerForm = document.getElementById('register-form');
const registerBand = document.getElementById('register-band');

const userInfoEl = document.getElementById('user-info');
const bookingDateInput = document.getElementById('booking-date');
const bookingTimeSelect = document.getElementById('booking-time');
const ticketInfoEl = document.getElementById('ticket-info');
const reservationForm = document.getElementById('reservation-form');
const messageEl = document.getElementById('message');
const scheduleEl = document.getElementById('schedule');
const bookingListEl = document.getElementById('booking-list');

const totalBookingsEl = document.getElementById('total-bookings');
const totalUsersEl = document.getElementById('total-users');
const totalBandsEl = document.getElementById('total-bands');
const currentUserEl = document.getElementById('current-user');

const adminListEl = document.getElementById('admin-list');
const userListEl = document.getElementById('user-list');
const bandListEl = document.getElementById('band-list');
const adminBookingsListEl = document.getElementById('admin-bookings-list');
const filterBandInput = document.getElementById('filter-band');
const filterDateInput = document.getElementById('filter-date');

const adminAddMessage = document.getElementById('admin-add-message');
const bandAddMessage = document.getElementById('band-add-message');
const timeMessage = document.getElementById('time-message');

const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const timeUnitInput = document.getElementById('time-unit');
const dailySlotsInput = document.getElementById('daily-slots');

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureInitialData() {
  if (!readStorage(STORAGE_KEYS.admins, null)) {
    writeStorage(STORAGE_KEYS.admins, [DEFAULT_ADMIN]);
  }

  if (!readStorage(STORAGE_KEYS.bands, null)) {
    writeStorage(STORAGE_KEYS.bands, DEFAULT_BANDS.map((name, index) => ({
      id: `band-${index + 1}`,
      name
    })));
  }

  if (!readStorage(STORAGE_KEYS.users, null)) {
    writeStorage(STORAGE_KEYS.users, []);
  }

  if (!readStorage(STORAGE_KEYS.bookings, null)) {
    writeStorage(STORAGE_KEYS.bookings, []);
  }

  if (!readStorage(STORAGE_KEYS.settings, null)) {
    writeStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }
}

function getAdmins() {
  return readStorage(STORAGE_KEYS.admins, [DEFAULT_ADMIN]);
}

function getBands() {
  return readStorage(STORAGE_KEYS.bands, DEFAULT_BANDS.map((name, index) => ({
    id: `band-${index + 1}`,
    name
  })));
}

function getUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

function getBookings() {
  return readStorage(STORAGE_KEYS.bookings, []);
}

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS) };
}

function getCurrentUser() {
  const value = localStorage.getItem(STORAGE_KEYS.sessionUser);
  return value ? JSON.parse(value) : null;
}

function saveCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.sessionUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.sessionUser);
  }
}

function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.sessionAdmin) === 'true';
}

function setAdminLoggedIn(value) {
  if (value) {
    localStorage.setItem(STORAGE_KEYS.sessionAdmin, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.sessionAdmin);
    localStorage.removeItem(STORAGE_KEYS.adminId);
  }
}

function getBandById(bandId) {
  return getBands().find((band) => band.id === bandId) || { id: '', name: '未所属' };
}

function setMessage(element, text, type = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function toMinutes(value) {
  const [hours, minutes] = (value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getTimeSlots() {
  const settings = getSettings();
  const start = toMinutes(settings.start);
  const end = toMinutes(settings.end);
  const unit = Number(settings.unit || 60);
  const slots = [];

  for (let time = start; time < end; time += unit) {
    const hour = String(Math.floor(time / 60)).padStart(2, '0');
    const minute = String(time % 60).padStart(2, '0');
    slots.push(`${hour}:${minute}`);
  }

  return slots;
}

function updateRegisterBandOptions() {
  registerBand.innerHTML = '<option value="">選択してください</option>';
  getBands().forEach((band) => {
    const option = document.createElement('option');
    option.value = band.id;
    option.textContent = band.name;
    registerBand.appendChild(option);
  });
}

function showLoginScreen() {
  loginScreen.classList.add('active');
  adminScreen.classList.remove('active');
  userScreen.classList.remove('active');
}

function showAdminScreen() {
  loginScreen.classList.remove('active');
  adminScreen.classList.add('active');
  userScreen.classList.remove('active');
  renderAdminDashboard();
}

function showUserScreen() {
  loginScreen.classList.remove('active');
  adminScreen.classList.remove('active');
  userScreen.classList.add('active');
  renderUserSession();
}

function renderAdminDashboard() {
  const users = getUsers();
  const bands = getBands();
  const bookings = getBookings();
  const adminId = localStorage.getItem(STORAGE_KEYS.adminId) || '管理者';

  totalUsersEl.textContent = users.length;
  totalBandsEl.textContent = bands.length;
  totalBookingsEl.textContent = bookings.length;
  currentUserEl.textContent = `ログイン中: ${adminId}`;

  renderAdminList();
  renderUserList();
  renderBandList();
  renderAdminBookings();
  renderAdminSettings();
}

function renderAdminList() {
  const admins = getAdmins();
  adminListEl.innerHTML = '';

  admins.forEach((admin) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${admin.id}</span>`;

    if (admin.id !== DEFAULT_ADMIN.id) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '削除';
      deleteBtn.addEventListener('click', () => {
        const filtered = getAdmins().filter((entry) => entry.id !== admin.id);
        writeStorage(STORAGE_KEYS.admins, filtered);
        renderAdminDashboard();
      });
      item.appendChild(deleteBtn);
    }

    adminListEl.appendChild(item);
  });
}

function renderUserList() {
  const users = getUsers();
  userListEl.innerHTML = '';

  if (!users.length) {
    userListEl.innerHTML = '<li class="empty-state">ユーザーはまだ登録されていません</li>';
    return;
  }

  users.forEach((user) => {
    const item = document.createElement('li');
    const bandName = getBandById(user.bandId).name;
    item.innerHTML = `<span>${user.name} / ${user.email} / ${bandName}</span>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', () => {
      const filtered = getUsers().filter((entry) => entry.id !== user.id);
      writeStorage(STORAGE_KEYS.users, filtered);
      renderAdminDashboard();
      const current = getCurrentUser();
      if (current && current.id === user.id) {
        saveCurrentUser(null);
        showLoginScreen();
      }
    });

    item.appendChild(deleteBtn);
    userListEl.appendChild(item);
  });
}

function renderBandList() {
  const bands = getBands();
  bandListEl.innerHTML = '';

  bands.forEach((band) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${band.name}</span>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', () => {
      const filtered = getBands().filter((entry) => entry.id !== band.id);
      writeStorage(STORAGE_KEYS.bands, filtered);
      updateRegisterBandOptions();
      renderAdminDashboard();
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.bandId === band.id) {
        saveCurrentUser(null);
        showLoginScreen();
      }
    });

    item.appendChild(deleteBtn);
    bandListEl.appendChild(item);
  });
}

function renderAdminBookings() {
  const bookings = getBookings();
  adminBookingsListEl.innerHTML = '';

  const keyword = filterBandInput.value.trim().toLowerCase();
  const dateFilter = filterDateInput.value;

  const filtered = bookings.filter((booking) => {
    const bandName = getBandById(booking.bandId).name.toLowerCase();
    const matchesBand = !keyword || bandName.includes(keyword);
    const matchesDate = !dateFilter || booking.date === dateFilter;
    return matchesBand && matchesDate;
  });

  if (!filtered.length) {
    adminBookingsListEl.innerHTML = '<li class="empty-state">条件に合う予約はありません</li>';
    return;
  }

  filtered.forEach((booking) => {
    const item = document.createElement('li');
    const bandName = getBandById(booking.bandId).name;
    item.innerHTML = `<span>${bandName} / ${booking.date} / ${booking.time} / ${booking.typeLabel}</span>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', () => {
      const updated = getBookings().filter((entry) => entry.id !== booking.id);
      writeStorage(STORAGE_KEYS.bookings, updated);
      renderAdminDashboard();
      renderUserSession();
    });

    item.appendChild(deleteBtn);
    adminBookingsListEl.appendChild(item);
  });
}

function renderAdminSettings() {
  const settings = getSettings();
  startTimeInput.value = settings.start;
  endTimeInput.value = settings.end;
  timeUnitInput.value = String(settings.unit);
  dailySlotsInput.value = settings.dailySlots || 12;
}

function getTicketCountForBandOnDate(bandId, dateString) {
  return getBookings().filter((booking) => booking.bandId === bandId && booking.date === dateString).length;
}

function updateTicketInfo() {
  const user = getCurrentUser();
  if (!user) {
    ticketInfoEl.textContent = '';
    return;
  }

  const dateString = bookingDateInput.value || new Date().toISOString().split('T')[0];
  const count = getTicketCountForBandOnDate(user.bandId, dateString);
  const remaining = Math.max(0, 2 - count);
  ticketInfoEl.textContent = `所属バンド: ${getBandById(user.bandId).name} / 残りチケット: ${remaining}`;
}

function renderTimeSelect() {
  bookingTimeSelect.innerHTML = '<option value="">選択してください</option>';
  getTimeSlots().forEach((slot) => {
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = slot;
    bookingTimeSelect.appendChild(option);
  });
}

function canBookOnDate(dateString) {
  const today = new Date();
  const selected = new Date(`${dateString}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (selected < todayStart) {
    return { allowed: false, message: '過去の日付には予約できません。' };
  }

  if (selected.getTime() === todayStart.getTime()) {
    const nowHour = today.getHours();
    if (nowHour < 8) {
      return { allowed: false, message: '当日は8:00以降に予約可能です。' };
    }
  }

  return { allowed: true, message: '予約可能です。' };
}

function renderUserSchedule() {
  const selectedDate = bookingDateInput.value || new Date().toISOString().split('T')[0];
  const bookings = getBookings().filter((booking) => booking.date === selectedDate);
  const slots = getTimeSlots();

  scheduleEl.innerHTML = '';
  slots.forEach((time) => {
    const match = bookings.find((booking) => booking.time === time);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';

    if (match) {
      slot.classList.add('booked');
      slot.disabled = true;
      slot.innerHTML = `<span class="slot-label">${time}</span><span class="slot-band">${getBandById(match.bandId).name}</span>`;
    } else {
      slot.innerHTML = `<span class="slot-label">${time}</span><span class="slot-band">空き</span>`;
      slot.addEventListener('click', () => {
        bookingTimeSelect.value = time;
        setMessage(messageEl, `${time} を選択しました。`, 'success');
      });
    }

    scheduleEl.appendChild(slot);
  });
}

function renderUserBookingList() {
  const user = getCurrentUser();
  bookingListEl.innerHTML = '';

  if (!user) return;

  const userBookings = getBookings().filter((booking) => booking.userId === user.id);
  if (!userBookings.length) {
    bookingListEl.innerHTML = '<li class="empty-state">予約はありません</li>';
    return;
  }

  userBookings
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .forEach((booking) => {
      const item = document.createElement('li');
      item.className = 'booking-item';

      const meta = document.createElement('div');
      meta.className = 'booking-meta';
      meta.innerHTML = `
        <span class="booking-band">${getBandById(booking.bandId).name}</span>
        <span>${booking.date} / ${booking.time} / ${booking.typeLabel}</span>
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '削除';
      deleteBtn.addEventListener('click', () => {
        const updated = getBookings().filter((entry) => entry.id !== booking.id);
        writeStorage(STORAGE_KEYS.bookings, updated);
        renderUserSession();
        renderAdminDashboard();
      });

      item.appendChild(meta);
      item.appendChild(deleteBtn);
      bookingListEl.appendChild(item);
    });
}

function renderUserSession() {
  const user = getCurrentUser();
  if (!user) return;

  userInfoEl.textContent = `${user.name} / ${getBandById(user.bandId).name}`;
  if (!bookingDateInput.value) {
    bookingDateInput.value = new Date().toISOString().split('T')[0];
  }

  renderTimeSelect();
  updateTicketInfo();
  renderUserSchedule();
  renderUserBookingList();
}

function handleUserLogin(email, password) {
  const match = getUsers().find((user) => user.email === email && user.password === password);
  if (!match) {
    setMessage(loginMessage, 'メールアドレスまたはパスワードが違います。', 'error');
    return;
  }

  saveCurrentUser(match);
  setAdminLoggedIn(false);
  setMessage(loginMessage, '', '');
  showUserScreen();
}

function handleAdminLogin(studentId, password) {
  const match = getAdmins().find((admin) => admin.id === studentId && admin.password === password);
  if (!match) {
    setMessage(loginMessage, '学籍番号またはパスワードが違います。', 'error');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.adminId, studentId);
  setAdminLoggedIn(true);
  setMessage(loginMessage, '', '');
  showAdminScreen();
}

function handleRegisterUser(event) {
  event.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const bandId = document.getElementById('register-band').value;

  if (!name || !email || !password || !bandId) {
    setMessage(registerMessage, 'すべての項目を入力してください。', 'error');
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    setMessage(registerMessage, 'そのメールアドレスはすでに登録されています。', 'error');
    return;
  }

  users.push({
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    bandId
  });
  writeStorage(STORAGE_KEYS.users, users);

  registerForm.reset();
  setMessage(registerMessage, '登録しました。ログインしてください。', 'success');
  updateRegisterBandOptions();

  setTimeout(() => {
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
    setMessage(registerMessage, '', '');
  }, 700);
}

function handleReservationSubmit(event) {
  event.preventDefault();

  const user = getCurrentUser();
  if (!user) {
    setMessage(messageEl, 'ログインしてください。', 'error');
    return;
  }

  const dateValue = bookingDateInput.value;
  const timeValue = bookingTimeSelect.value;

  if (!dateValue || !timeValue) {
    setMessage(messageEl, '予約日と時間帯を選択してください。', 'error');
    return;
  }

  const permission = canBookOnDate(dateValue);
  if (!permission.allowed) {
    setMessage(messageEl, permission.message, 'error');
    return;
  }

  const now = new Date();
  const bandCount = getTicketCountForBandOnDate(user.bandId, dateValue);
  if (bandCount >= 2) {
    setMessage(messageEl, '1バンドあたり1日2チケットまでです。', 'error');
    return;
  }

  const existing = getBookings().find((booking) => booking.date === dateValue && booking.time === timeValue);
  if (existing) {
    setMessage(messageEl, 'その時間帯はすでに予約されています。', 'error');
    return;
  }

  const bookingType = dateValue === new Date().toISOString().split('T')[0] && now.getHours() >= 8 ? '当日枠' : '前日枠';

  const bookings = getBookings();
  bookings.push({
    id: `booking-${Date.now()}`,
    bandId: user.bandId,
    userId: user.id,
    date: dateValue,
    time: timeValue,
    typeLabel: bookingType
  });

  writeStorage(STORAGE_KEYS.bookings, bookings);
  setMessage(messageEl, '予約を登録しました。', 'success');
  renderUserSession();
  renderAdminDashboard();
}

function handleSaveSettings() {
  const settings = {
    start: startTimeInput.value || DEFAULT_SETTINGS.start,
    end: endTimeInput.value || DEFAULT_SETTINGS.end,
    unit: String(timeUnitInput.value || DEFAULT_SETTINGS.unit),
    dailySlots: Number(dailySlotsInput.value || 12)
  };

  if (toMinutes(settings.start) >= toMinutes(settings.end)) {
    setMessage(timeMessage, '開始時刻は終了時刻より前にしてください。', 'error');
    return;
  }

  writeStorage(STORAGE_KEYS.settings, settings);
  setMessage(timeMessage, '設定を保存しました。', 'success');
  renderTimeSelect();
  renderUserSchedule();
}

function handleAddAdmin() {
  const id = document.getElementById('new-admin-id').value.trim();
  const password = document.getElementById('new-admin-password').value.trim();

  if (!id || !password) {
    setMessage(adminAddMessage, '学籍番号とパスワードを入力してください。', 'error');
    return;
  }

  const admins = getAdmins();
  if (admins.some((admin) => admin.id === id)) {
    setMessage(adminAddMessage, 'その学籍番号はすでに登録されています。', 'error');
    return;
  }

  admins.push({ id, password });
  writeStorage(STORAGE_KEYS.admins, admins);
  document.getElementById('new-admin-id').value = '';
  document.getElementById('new-admin-password').value = '';
  setMessage(adminAddMessage, '管理者を追加しました。', 'success');
  renderAdminDashboard();
}

function handleAddBand() {
  const name = document.getElementById('new-band-name').value.trim();
  if (!name) {
    setMessage(bandAddMessage, 'バンド名を入力してください。', 'error');
    return;
  }

  const bands = getBands();
  if (bands.some((band) => band.name === name)) {
    setMessage(bandAddMessage, 'そのバンド名はすでに登録されています。', 'error');
    return;
  }

  bands.push({ id: `band-${Date.now()}`, name });
  writeStorage(STORAGE_KEYS.bands, bands);
  document.getElementById('new-band-name').value = '';
  updateRegisterBandOptions();
  renderAdminDashboard();
  setMessage(bandAddMessage, 'バンドを追加しました。', 'success');
}

function bindEvents() {
  document.querySelectorAll('.login-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      const isAdmin = mode === 'admin';
      document.querySelectorAll('.login-tab').forEach((btn) => btn.classList.toggle('active', btn === tab));
      userLoginForm.style.display = isAdmin ? 'none' : 'block';
      adminLoginForm.style.display = isAdmin ? 'block' : 'none';
    });
  });

  userLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value.trim();
    handleUserLogin(email, password);
  });

  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = document.getElementById('admin-id').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    handleAdminLogin(id, password);
  });

  document.getElementById('show-register-btn').addEventListener('click', () => {
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
    setMessage(registerMessage, '', '');
  });

  document.getElementById('back-to-login-btn').addEventListener('click', () => {
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
    registerForm.reset();
    setMessage(registerMessage, '', '');
  });

  registerForm.addEventListener('submit', handleRegisterUser);

  document.getElementById('logout-btn').addEventListener('click', () => {
    setAdminLoggedIn(false);
    saveCurrentUser(null);
    showLoginScreen();
    setMessage(loginMessage, '', '');
  });

  document.getElementById('user-logout-btn').addEventListener('click', () => {
    saveCurrentUser(null);
    setAdminLoggedIn(false);
    showLoginScreen();
    setMessage(loginMessage, '', '');
  });

  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
      const target = document.getElementById(`${button.dataset.tab}-tab`);
      if (target) {
        target.classList.add('active');
      }
    });
  });

  document.getElementById('save-time-settings').addEventListener('click', handleSaveSettings);
  document.getElementById('add-admin-btn').addEventListener('click', handleAddAdmin);
  document.getElementById('add-band-btn').addEventListener('click', handleAddBand);
  document.getElementById('filter-btn').addEventListener('click', renderAdminBookings);
  filterBandInput.addEventListener('input', renderAdminBookings);
  filterDateInput.addEventListener('change', renderAdminBookings);

  reservationForm.addEventListener('submit', handleReservationSubmit);
  bookingDateInput.addEventListener('change', () => {
    updateTicketInfo();
    renderUserSchedule();
  });
}

function init() {
  ensureInitialData();
  updateRegisterBandOptions();
  bindEvents();

  if (isAdminLoggedIn()) {
    showAdminScreen();
  } else if (getCurrentUser()) {
    showUserScreen();
  } else {
    showLoginScreen();
  }

  renderAdminDashboard();
  renderTimeSelect();
  bookingDateInput.value = new Date().toISOString().split('T')[0];
  renderUserSchedule();
  renderUserBookingList();
  updateTicketInfo();
}

init();
