const STORAGE_KEY = 'music-room-bookings-v1';
const MAX_BOOKINGS_PER_BAND = 2;
const ROOMS = ['Room A', 'Room B', 'Room C'];
const TIMES = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const bookingForm = document.getElementById('reservation-form');
const bandInput = document.getElementById('band-name');
const roomInput = document.getElementById('room');
const dayInput = document.getElementById('day');
const timeInput = document.getElementById('time');
const message = document.getElementById('message');
const scheduleEl = document.getElementById('schedule');
const bookingListEl = document.getElementById('booking-list');

let bookings = loadBookings();

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load bookings:', error);
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function getBookingsForSlot(room, day, time) {
  return bookings.filter((booking) => booking.room === room && booking.day === day && booking.time === time);
}

function getBandReservationCount(bandName, room, day) {
  const normalizedName = bandName.trim().toLowerCase();
  return bookings.filter(
    (booking) => booking.band.toLowerCase() === normalizedName && booking.room === room && booking.day === day
  ).length;
}

function renderSchedule() {
  scheduleEl.innerHTML = '';

  ROOMS.forEach((room) => {
    const roomBlock = document.createElement('div');
    roomBlock.className = 'room-block';

    const roomHeader = document.createElement('div');
    roomHeader.className = 'room-header';
    roomHeader.textContent = room;
    roomBlock.appendChild(roomHeader);

    const slotGrid = document.createElement('div');
    slotGrid.className = 'slot-grid';

    TIMES.forEach((time) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'slot';
      slot.dataset.room = room;
      slot.dataset.time = time;

      const reservations = getBookingsForSlot(room, dayInput.value, time);
      if (reservations.length > 0) {
        slot.classList.add('booked');
        slot.disabled = true;
        const first = reservations[0];
        slot.innerHTML = `
          <span class="slot-label">${time}</span>
          <span class="slot-band">${first.band}</span>
        `;
      } else {
        slot.innerHTML = `<span class="slot-label">${time}</span>`;
        slot.addEventListener('click', () => {
          roomInput.value = room;
          timeInput.value = time;
          setMessage(`${room} / ${time} を選択しました。`, 'success');
        });
      }

      slotGrid.appendChild(slot);
    });

    roomBlock.appendChild(slotGrid);
    scheduleEl.appendChild(roomBlock);
  });
}

function renderBookingList() {
  bookingListEl.innerHTML = '';

  if (bookings.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'まだ予約はありません。';
    bookingListEl.appendChild(empty);
    return;
  }

  bookings
    .slice()
    .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))
    .forEach((booking) => {
      const item = document.createElement('li');
      item.className = 'booking-item';

      const meta = document.createElement('div');
      meta.className = 'booking-meta';
      meta.innerHTML = `
        <span class="booking-band">${booking.band}</span>
        <span>${booking.room} · ${formatDate(booking.day)} · ${booking.time}</span>
      `;

      const actions = document.createElement('div');
      actions.className = 'booking-actions';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '削除';
      removeBtn.className = 'delete-btn';
      removeBtn.addEventListener('click', () => {
        bookings = bookings.filter((item) => !(item.band === booking.band && item.room === booking.room && item.day === booking.day && item.time === booking.time));
        saveBookings();
        render();
      });

      actions.appendChild(removeBtn);
      item.appendChild(meta);
      item.appendChild(actions);
      bookingListEl.appendChild(item);
    });
}

function render() {
  renderSchedule();
  renderBookingList();
}

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const band = bandInput.value.trim();
  const room = roomInput.value;
  const day = dayInput.value;
  const time = timeInput.value;

  if (!band || !room || !day || !time) {
    setMessage('すべての項目を入力してください。', 'error');
    return;
  }

  const existingInRoom = getBookingsForSlot(room, day, time);
  if (existingInRoom.length > 0) {
    setMessage('その時間帯はすでに予約されています。', 'error');
    return;
  }

  const bandCount = getBandReservationCount(band, room, day);
  if (bandCount >= MAX_BOOKINGS_PER_BAND) {
    setMessage(`「${band}」はこの音楽室・日付で${MAX_BOOKINGS_PER_BAND}枠までです。`, 'error');
    return;
  }

  bookings.push({ band, room, day, time });
  saveBookings();
  bookingForm.reset();
  setMessage('予約を登録しました。', 'success');
  render();
});

dayInput.addEventListener('change', renderSchedule);

if (!dayInput.value) {
  dayInput.value = new Date().toISOString().split('T')[0];
}

render();
