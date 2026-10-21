// Small original synthetic mechanics fixtures. No validated CEFR or placement claims.
export const contentVersion = 'p0-1';
export const notes = {
  clear: [
    { id: 'roof-note', title: 'A note from the astronomer', where: 'Tucked into the roof', text: 'To reveal the stars, keep the shutter closed and point the mirror at the sky. Set both before you light the lantern.', vi: 'Để hiện các vì sao, hãy đóng cửa chớp và hướng gương lên bầu trời. Chỉnh cả hai trước khi thắp đèn.' },
    { id: 'garden-note', title: 'The gardener’s field note', where: 'Between the moonflowers', text: 'The moonflowers need an open shutter and a mirror pointing toward the path. Light the lantern after you set both.', vi: 'Hoa trăng cần cửa chớp mở và gương hướng về lối đi. Thắp đèn sau khi chỉnh cả hai.' },
  ],
  mist: [
    { id: 'roof-note', title: 'The astronomer’s misty-day note', where: 'A different sky today', text: 'In the mist, the stars appear only with the shutter closed and the mirror pointing toward the path. Set both before lighting the lantern.', vi: 'Trong sương, các vì sao chỉ hiện khi cửa chớp đóng và gương hướng về lối đi. Chỉnh cả hai trước khi thắp đèn.' },
    { id: 'garden-note', title: 'A note for a misty garden', where: 'The flowers have a new secret', text: 'On a misty day, open the shutter and point the mirror at the sky to wake the moonflowers. Light the lantern after you set both.', vi: 'Vào ngày có sương, mở cửa chớp và hướng gương lên bầu trời để đánh thức hoa trăng. Thắp đèn sau khi chỉnh cả hai.' },
  ],
};

export const copy = {
  en: {
    journey: 'A LITTLE LIGHT, A NEW POSSIBILITY', chapter: '01 · The folded observatory',
    title: 'Some places open\nwith a little curiosity.',
    subtitle: 'Meet Nim. A wind-up guide, an unopened observatory, and a plan only you can make.',
    journal: 'Field journal', settings: 'Quiet motion', living: 'Gentle motion',
    modes: { kids: 'Kids', balanced: 'Balanced', serious: 'Serious' },
    modeDetails: { kids: 'Make it happen, one little experiment at a time.', balanced: 'Choose a discovery. Find a way to bring it to light.', serious: 'A small planning challenge. Two sources. More than one solution.' },
    source: 'Find the field notes', sourceHint: 'Two little notes hold the rules of this place.',
    goal: 'What will you uncover?', stars: 'The star atlas', flowers: 'The moonflower garden',
    starsDesc: 'A sky full of forgotten connections.', flowersDesc: 'Something that only blooms in lantern light.',
    plan: 'Leave Nim a plan', planHint: 'Set the tools. Put the instructions in order. Then see what happens.',
    shutter: 'Shutter', mirror: 'Mirror', open: 'Open', closed: 'Closed', sky: 'Sky', path: 'Path',
    run: 'Let Nim try', running: 'Nim is following your plan…',
    note: 'Read note', hint: 'A little language help', tryAgain: 'Change your plan & try again',
    beforeHint: '“Before” tells us what needs to happen first. “After” tells us what happens later. Read the two notes to decide which tools Nim needs.',
    more: 'Try a misty return', clear: 'Clear evening', mist: 'Misty evening',
    weatherHelp: 'The same place, a different rule. There are fresh notes to discover.',
    close: 'Close', translate: 'Show Vietnamese help', hideTranslation: 'Hide Vietnamese help',
    journalTitle: 'Small discoveries, all yours.', noDiscovery: 'Your first page is waiting. Try a plan at the observatory.',
    attempts: 'Plans tried', evidence: 'A record of your experiments, not a proficiency score.',
    prototype: 'P0 playtest · Original synthetic content · Session only',
    reset: 'Start a fresh visit', emptyReset: 'Your visit starts fresh when you reload. Nothing here is a learning account.',
    kidsLook: 'First, look for a clue.', kidsBuild: 'Now, make something happen.', kidsTry: 'Ready? Let Nim follow your steps.',
    kidsNext: 'I have a clue. Let’s make a plan', kidsReady: 'My plan is ready', back: 'Back to my plan',
    field: 'FIELD NOTES', heard: 'notes found',
    seriousPlan: 'Planning board', seriousSources: 'Evidence on the table',
    testWeather: 'Test the other weather', counterHint: 'A counterexample helps you test a plan. This preview counts as support.',
    justification: 'Why should this plan work?', justificationHint: 'Optional reflection. Saved only for this visit; not automatically graded.',
    transferTitle: 'A note for your next adventure', transfer: 'At a library, the door must be unlocked before visitors enter. Complete the instruction:',
    transferPrompt: 'Unlock the door ___ you let visitors in.', transferCheck: 'Check my note', transferLabel: 'Missing English word',
    transferSuccess: 'That sequence works in a new place, too. This is one practice response, not a mastery claim.',
    transferRetry: 'Look at which action must happen first. You can revise the note.',
    moveUp: 'Move earlier', moveDown: 'Move later', direction: 'Point the mirror', set: 'Your instructions',
  },
  vi: {
    journey: 'MỘT CHÚT ÁNH SÁNG, MỘT ĐIỀU MỚI MẺ', chapter: '01 · Đài quan sát gấp giấy',
    title: 'Một chút tò mò,\nmở ra bao điều mới.',
    subtitle: 'Gặp Nim: một người dẫn đường lên dây cót, một đài quan sát chưa mở, và kế hoạch của bạn.',
    journal: 'Sổ khám phá', settings: 'Giảm chuyển động', living: 'Chuyển động nhẹ',
    modes: { kids: 'Trẻ em', balanced: 'Cân bằng', serious: 'Tập trung' },
    modeDetails: { kids: 'Thử từng bước nhỏ và xem điều gì xảy ra.', balanced: 'Chọn điều muốn khám phá và tìm cách thắp sáng nó.', serious: 'Một thử thách lập kế hoạch: hai nguồn thông tin, nhiều cách giải.' },
    source: 'Tìm các ghi chú', sourceHint: 'Hai ghi chú nhỏ hé lộ quy tắc của nơi này.',
    goal: 'Bạn muốn khám phá điều gì?', stars: 'Bản đồ sao', flowers: 'Vườn hoa trăng',
    starsDesc: 'Những kết nối bị lãng quên trên bầu trời.', flowersDesc: 'Chỉ nở dưới ánh đèn lồng.',
    plan: 'Để lại kế hoạch cho Nim', planHint: 'Chỉnh công cụ, sắp xếp chỉ dẫn, rồi quan sát kết quả.',
    shutter: 'Cửa chớp', mirror: 'Gương', open: 'Mở', closed: 'Đóng', sky: 'Bầu trời', path: 'Lối đi',
    run: 'Để Nim thử', running: 'Nim đang làm theo kế hoạch…',
    note: 'Đọc ghi chú', hint: 'Gợi ý ngôn ngữ', tryAgain: 'Chỉnh kế hoạch và thử lại',
    beforeHint: '“Before” cho biết việc phải làm trước. “After” cho biết việc làm sau. Đọc hai ghi chú để chọn cách chỉnh công cụ cho Nim.',
    more: 'Trở lại vào ngày có sương', clear: 'Chiều trời trong', mist: 'Chiều có sương',
    weatherHelp: 'Vẫn nơi này, nhưng quy tắc đã đổi. Hãy tìm ghi chú mới.',
    close: 'Đóng', translate: 'Xem trợ giúp tiếng Việt', hideTranslation: 'Ẩn trợ giúp tiếng Việt',
    journalTitle: 'Những khám phá nhỏ của bạn.', noDiscovery: 'Trang đầu đang chờ bạn. Hãy thử một kế hoạch ở đài quan sát.',
    attempts: 'Kế hoạch đã thử', evidence: 'Ghi lại các lần thử, không phải điểm trình độ tiếng Anh.',
    prototype: 'Chơi thử P0 · Nội dung thử nghiệm tự tạo · Chỉ trong phiên này',
    reset: 'Bắt đầu chuyến thăm mới', emptyReset: 'Tải lại sẽ bắt đầu chuyến thăm mới. Đây chưa phải tài khoản học tập.',
    kidsLook: 'Trước hết, tìm một manh mối.', kidsBuild: 'Giờ hãy thử tạo ra điều gì đó.', kidsTry: 'Sẵn sàng chưa? Để Nim làm theo nhé.',
    kidsNext: 'Đã có manh mối. Lập kế hoạch thôi', kidsReady: 'Kế hoạch đã sẵn sàng', back: 'Trở lại kế hoạch',
    field: 'GHI CHÚ KHÁM PHÁ', heard: 'ghi chú đã tìm',
    seriousPlan: 'Bảng kế hoạch', seriousSources: 'Thông tin để đối chiếu',
    testWeather: 'Thử thời tiết khác', counterHint: 'Ví dụ đối chứng giúp kiểm tra kế hoạch. Lần xem thử này được ghi là có trợ giúp.',
    justification: 'Vì sao kế hoạch này có thể thành công?', justificationHint: 'Suy ngẫm tùy chọn, chỉ giữ trong phiên này, không tự động chấm.',
    transferTitle: 'Ghi chú cho chuyến đi tiếp theo', transfer: 'Ở thư viện, cần mở khóa cửa trước khi khách vào. Hoàn thành chỉ dẫn:',
    transferPrompt: 'Unlock the door ___ you let visitors in.', transferCheck: 'Kiểm tra ghi chú', transferLabel: 'Từ tiếng Anh còn thiếu',
    transferSuccess: 'Thứ tự này cũng đúng ở một nơi mới. Đây chỉ là một câu luyện tập, chưa kết luận đã thành thạo.',
    transferRetry: 'Xem hành động nào phải làm trước. Bạn có thể sửa ghi chú.',
    moveUp: 'Chuyển lên trước', moveDown: 'Chuyển xuống sau', direction: 'Hướng gương', set: 'Chỉ dẫn của bạn',
  },
};

export function instruction(command, plan) {
  if (command === 'shutter') return `${plan.shutter === 'open' ? 'Open' : 'Close'} the shutter`;
  if (command === 'mirror') return `Point the mirror toward the ${plan.mirror}`;
  return 'Light the lantern';
}

export function feedback(result, lang = 'en') {
  if (result.success) return lang === 'vi'
    ? { title: result.discovery === 'stars' ? 'Bạn đã mở bản đồ sao!' : 'Hoa trăng đã nở!', body: 'Nim làm theo chỉ dẫn của bạn. Hãy khám phá cách còn lại, hoặc quay lại khi có sương.' }
    : { title: result.discovery === 'stars' ? 'You unfolded the star atlas!' : 'The moonflowers are awake!', body: 'Nim followed your instructions. There is another discovery here, or a different evening to explore.' };
  const en = {
    order: ['A little too soon…', 'Nim lit the lantern before both tools were set. “Before” and “after” tell you where the lantern belongs. Try moving that step.'],
    shutter: ['The light needs a different doorway.', `For this discovery, the notes call for a ${result.expected.shutter} shutter. Change the shutter instruction and let Nim try again.`],
    mirror: ['The light found a different way.', `For this discovery and weather, point the mirror toward the ${result.expected.mirror}. A fresh reading of the notes can help.`],
    'invalid-plan': ['Nim needs three clear steps.', 'Include one shutter instruction, one mirror instruction and one lantern instruction.'],
  };
  const vi = {
    order: ['Hơi sớm một chút…', 'Nim đã thắp đèn trước khi chỉnh xong cả hai công cụ. “Before” và “after” giúp bạn tìm vị trí đúng của bước thắp đèn. Hãy đổi thứ tự.'],
    shutter: ['Ánh sáng cần một lối khác.', `Theo ghi chú, lần khám phá này cần cửa chớp ${result.expected.shutter === 'open' ? 'mở' : 'đóng'}. Hãy sửa chỉ dẫn rồi thử lại.`],
    mirror: ['Ánh sáng đã đi một đường khác.', `Với thời tiết và mục tiêu này, hãy hướng gương về ${result.expected.mirror === 'sky' ? 'bầu trời' : 'lối đi'}. Bạn có thể đọc lại ghi chú.`],
    'invalid-plan': ['Nim cần ba bước rõ ràng.', 'Cần một chỉ dẫn cửa chớp, một chỉ dẫn gương và một chỉ dẫn đèn lồng.'],
  };
  const parts = (lang === 'vi' ? vi : en)[result.code];
  return { title: parts[0], body: parts[1] };
}
