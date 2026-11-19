// Original Atlas study units. IDs and scoring keys identify this published edition.
export const b1Units = [
  {
    id: "course-b1-lost-property-v1",
    level: "B1",
    kind: "grammar",
    title: ["Reporting something lost","Trình báo đồ thất lạc"],
    objective: ["Use the past continuous for an action already in progress and the past simple for a shorter event. Include the last place and time you are sure about.","Dùng quá khứ tiếp diễn cho việc đang diễn ra và quá khứ đơn cho sự việc xảy đến. Nêu địa điểm và thời gian cuối cùng mà bạn nhớ chắc."],
    examples: ["I was reading when the lights went out.","I last saw my phone beside the ticket machine."],
    lexicon: [
      {"term":"belong to","kind":"expression","en":"to be owned by someone","vi":"thuộc về ai","example":"This green case belongs to my sister."},
      {"term":"hand in","kind":"phrasal-verb","en":"to give a found object to someone responsible","vi":"nộp lại, giao lại","example":"Please hand in any lost keys at the desk."},
      {"term":"description","kind":"word","en":"words that tell what something is like","vi":"lời mô tả","example":"Her description mentioned a red zip."},
      {"term":"platform","kind":"word","en":"the place beside a railway track where people get on a train","vi":"sân ga","example":"We waited on platform four."},
      {"term":"identify","kind":"word","en":"to show which person or thing something is","vi":"nhận ra, xác định","example":"Can you identify your case among these bags?"},
      {"term":"lost property","kind":"collocation","en":"items found and kept until their owners collect them","vi":"đồ thất lạc được tìm thấy","example":"Ask at the lost property office."}
    ],
    items: [
      {"prompt":"Use the past continuous of wait. I ___ for a train when I noticed my bag was missing.","keys":["was waiting"],"why":["Waiting was already happening when the shorter event occurred.","Tôi đang đợi tàu thì phát hiện mất túi, nên hành động kéo dài là was waiting."]},
      {"prompt":"“I had my scarf on the train. At home I saw that it was gone.” Which detail is certain?","options":["The scarf is at home.","The person had the scarf on the train.","Somebody took it at the station."],"keys":["The person had the scarf on the train."],"why":["The report establishes where it was last seen. It does not establish where it fell or who took it.","Lời kể xác nhận lần cuối có khăn là trên tàu. Chưa biết khăn rơi ở đâu hay do ai lấy."]},
      {"prompt":"Use the past simple of ring. While I was searching my pockets, my phone ___.","keys":["rang"],"why":["The ringing is the event inside the longer search; ring becomes rang.","Tiếng chuông là sự việc xen vào lúc tìm đồ. Quá khứ của ring là rang."]},
      {"prompt":"The desk has three black bags. Which detail best helps identify yours?","options":["Mine has a yellow zip and my initials inside.","Mine is a bag.","I was worried about it."],"keys":["Mine has a yellow zip and my initials inside."],"why":["The zip and initials separate your bag from the other black bags.","Màu khóa kéo và chữ cái đầu của tên giúp phân biệt túi của bạn."]},
      {"prompt":"“A passenger handed the wallet in at noon.” What happened at noon?","options":["The wallet was given to staff.","Its owner first noticed the loss.","The passenger bought a wallet."],"keys":["The wallet was given to staff."],"why":["Hand in describes giving a found item to the responsible person.","Hand in nói về việc giao đồ tìm được cho người phụ trách."]}
    ],
    prerequisite: "course-a2-last-weekend-v1"
  },
  {
    id: "course-b1-staying-in-touch-v1",
    level: "B1",
    kind: "grammar",
    title: ["Keeping in touch","Giữ liên lạc"],
    objective: ["For a situation that began earlier and continues now, use have or has + past participle. Since introduces a starting point; for gives a length of time.","Dùng have hoặc has + quá khứ phân từ cho tình trạng bắt đầu trước đây và còn tiếp diễn. Since đi với mốc bắt đầu; for đi với khoảng thời gian."],
    examples: ["We've known each other since school.","He has lived nearby for three years."],
    lexicon: [
      {"term":"keep in touch","kind":"collocation","en":"to continue communicating over time","vi":"giữ liên lạc","example":"We keep in touch by email."},
      {"term":"neighbour","kind":"word","en":"someone living near you","vi":"hàng xóm","example":"My neighbour collects my letters when I'm away."},
      {"term":"move away","kind":"phrasal-verb","en":"to leave a place to live somewhere else","vi":"chuyển đi nơi khác","example":"My closest friend moved away last year."},
      {"term":"catch up","kind":"phrasal-verb","en":"to share news after time apart","vi":"hỏi thăm và kể chuyện sau thời gian xa cách","example":"Let's catch up over coffee."},
      {"term":"recently","kind":"word","en":"a short time ago or during the near past","vi":"gần đây","example":"Have you seen An recently?"},
      {"term":"childhood","kind":"word","en":"the time when someone was a child","vi":"thời thơ ấu","example":"She remembers her childhood in Hue."}
    ],
    items: [
      {"prompt":"Choose for or since. They have been neighbours ___ 2021.","keys":["since"],"why":["2021 is the starting year. Since connects that point to now.","2021 là mốc bắt đầu. Since nối mốc đó với hiện tại."]},
      {"prompt":"Which statement clearly says the friendship still continues?","options":["We've been friends for ten years.","We were friends for ten years before we lost touch.","We first met ten years ago."],"keys":["We've been friends for ten years."],"why":["Have been describes a continuing friendship. First met gives only the starting event.","Have been cho biết tình bạn vẫn tiếp tục. First met chỉ cho biết lúc gặp nhau."]},
      {"prompt":"Write the present perfect of know after she. She ___ me since our first day of school.","keys":["has known"],"why":["'She has' is followed by the past participle known.","She đi với has và quá khứ phân từ của know là known."]},
      {"prompt":"“I moved away, but we still catch up every month.” What has continued?","options":["Living in the same street","Moving house monthly","Sharing news"],"keys":["Sharing news"],"why":["Still catch up shows continued contact despite living apart.","Still catch up cho thấy hai người vẫn trao đổi tin tức dù đã chuyển đi."]},
      {"prompt":"Which reply gives a duration to “How long have you lived here?”","options":["At number twelve near the station.","For about six months.","Next January, I hope."],"keys":["For about six months."],"why":["Six months states an amount of time. A since phrase gives a starting point instead.","Six months là một khoảng thời gian. Cụm bắt đầu bằng since chỉ mốc thời gian."]}
    ],
    prerequisite: "course-a2-last-weekend-v1"
  },
  {
    id: "course-b1-repairs-v1",
    level: "B1",
    kind: "grammar",
    title: ["Arranging a repair","Hẹn sửa đồ"],
    objective: ["Use if + present simple for a real future condition, and will or can for its result. Unless means except if.","Dùng if + hiện tại đơn cho điều kiện có thể xảy ra trong tương lai, và will hoặc can cho kết quả. Unless mang nghĩa trừ khi."],
    examples: ["If the part arrives, we can finish tomorrow.","We won't charge you unless you agree to the price."],
    lexicon: [
      {"term":"leak","kind":"word","en":"a place where liquid escapes","vi":"chỗ rò rỉ","example":"There is a small leak under the sink."},
      {"term":"appointment","kind":"word","en":"an arranged time to meet someone","vi":"cuộc hẹn","example":"I booked an appointment for Friday."},
      {"term":"spare part","kind":"collocation","en":"a piece used to replace a damaged one","vi":"phụ tùng thay thế","example":"The shop has the spare part we need."},
      {"term":"call back","kind":"phrasal-verb","en":"to telephone someone again","vi":"gọi lại","example":"The mechanic will call back after lunch."},
      {"term":"charge","kind":"word","en":"to ask someone to pay a price","vi":"tính phí","example":"They charge ten pounds for delivery."},
      {"term":"available","kind":"word","en":"free to be used or able to attend","vi":"có sẵn; có thể tham gia","example":"The technician is available on Tuesday."}
    ],
    items: [
      {"prompt":"Use arrive in the correct form. If the new handle ___ today, we'll fit it tonight.","keys":["arrives"],"why":["Use the present simple in this if-clause. Handle takes arrives.","Trong mệnh đề if, dùng hiện tại đơn. Chủ ngữ the new handle đi với arrives."]},
      {"prompt":"“We'll visit on Friday unless you cancel.” You do nothing. What is the plan?","options":["An automatic cancellation","A visit on Friday","A call to choose a different day"],"keys":["A visit on Friday"],"why":["Unless you cancel is the exception. Without cancellation the visit goes ahead.","Hủy hẹn là ngoại lệ. Nếu không hủy thì vẫn có người đến vào thứ Sáu."]},
      {"prompt":"Complete with if or unless. The office closes at five. Call now ___ you want to speak to someone today.","keys":["if"],"why":["Wanting to speak today is the condition for calling now.","Muốn nói chuyện ngay hôm nay là điều kiện để gọi ngay, nên dùng if."]},
      {"prompt":"The estimate says, “Parts included; travel costs extra.” What should you check before agreeing?","options":["Whether the parts are included","The travel fee","The colour of the technician's car"],"keys":["The travel fee"],"why":["The travel amount is still unknown and affects the final bill.","Phí đi lại chưa được nêu cụ thể và sẽ ảnh hưởng đến số tiền phải trả."]},
      {"prompt":"“The earliest appointment is Monday; Tuesday afternoon is also free.” You work all day Monday. What can you request?","options":["Monday morning only","Tuesday afternoon","Sunday night"],"keys":["Tuesday afternoon"],"why":["Tuesday is an offered alternative compatible with the stated work schedule.","Chiều thứ Ba là giờ còn trống và không trùng lịch làm việc đã nói."]}
    ],
    prerequisite: "course-a2-plans-v1"
  },
  {
    id: "course-b1-enquiries-v1",
    level: "B1",
    kind: "communication",
    title: ["Asking at a service desk","Hỏi thông tin ở quầy"],
    objective: ["After Could you tell me …?, use statement word order in the question inside it. Use if or whether for a yes/no question.","Sau Could you tell me …?, sắp từ của câu hỏi lồng theo trật tự câu kể. Dùng if hoặc whether cho câu hỏi có/không."],
    examples: ["Where does the bus stop? Could you tell me where the bus stops?","Could you tell me whether the office is open?"],
    lexicon: [
      {"term":"enquiry","kind":"word","en":"a request for information","vi":"yêu cầu hỏi thông tin","example":"I have an enquiry about tickets."},
      {"term":"opening hours","kind":"collocation","en":"the times a place is open","vi":"giờ mở cửa","example":"The opening hours change in summer."},
      {"term":"queue","kind":"word","en":"a line of people waiting","vi":"hàng người đang chờ","example":"There is a queue near the door."},
      {"term":"form","kind":"word","en":"a document with spaces for information","vi":"mẫu đơn","example":"Please fill in this form."},
      {"term":"fill in","kind":"phrasal-verb","en":"to write the requested information in a form","vi":"điền vào","example":"Fill in your name on the first line."},
      {"term":"desk","kind":"word","en":"a place where a service is provided","vi":"quầy","example":"Collect the pass at the information desk."}
    ],
    items: [
      {"prompt":"Complete the polite question: “Could you tell me ___?”","options":["when the office closes","when does the office close","when closes the office"],"keys":["when the office closes"],"why":["Inside the question, the subject the office comes before closes.","Trong câu hỏi gián tiếp, chủ ngữ the office đứng trước closes."]},
      {"prompt":"Write if or whether. Do they take cards? → Could you tell me ___ they take cards?","keys":["if","whether"],"why":["Both if and whether can introduce this embedded yes/no question.","Cả if và whether đều mở đầu được câu hỏi có/không gián tiếp này."]},
      {"prompt":"“Fill in the form before you join the queue.” What should you do first?","options":["Wait in line.","Ask somebody else to queue.","Write the requested details."],"keys":["Write the requested details."],"why":["Before places the form-filling ahead of queuing.","Before cho biết điền mẫu đơn là việc làm trước khi xếp hàng."]},
      {"prompt":"Use be in the present simple. Could you tell me where the toilets ___?","keys":["are"],"why":["The plural subject toilets takes are, after the subject in the embedded question.","Toilets là số nhiều nên dùng are sau chủ ngữ trong câu hỏi gián tiếp."]},
      {"prompt":"A staff member says, “Last entry is at five; we close at six.” You arrive at 5:15. What follows?","options":["You can enter until six.","The building is still open but you are too late to enter.","The building closed at five."],"keys":["The building is still open but you are too late to enter."],"why":["Last entry limits new arrivals. Closing time concerns people already inside.","Last entry là giờ nhận khách cuối. Closing time là lúc nơi đó đóng cửa."]}
    ],
    prerequisite: "course-a2-invites-v1"
  },
  {
    id: "course-b1-recommendations-v1",
    level: "B1",
    kind: "grammar",
    title: ["Recommending a place","Giới thiệu một địa điểm"],
    objective: ["Use who for a person, where for a place in which something happens, and that or which for a thing. Include a reason relevant to the listener.","Dùng who cho người, where cho nơi diễn ra sự việc, và that hoặc which cho vật. Khi giới thiệu, nêu lý do phù hợp với người nghe."],
    examples: ["Try the café where we had lunch.","The guide who showed us around spoke slowly."],
    lexicon: [
      {"term":"recommend","kind":"word","en":"to suggest something you think is good","vi":"giới thiệu, đề xuất","example":"I recommend the morning tour."},
      {"term":"quiet","kind":"word","en":"making little noise","vi":"yên tĩnh","example":"Ask for a quiet room at the back."},
      {"term":"entrance","kind":"word","en":"the way into a place","vi":"lối vào","example":"The entrance is beside the bookshop."},
      {"term":"guide","kind":"word","en":"a person who shows others around","vi":"hướng dẫn viên","example":"Our guide knows the old town well."},
      {"term":"within walking distance","kind":"expression","en":"near enough to reach on foot","vi":"trong khoảng có thể đi bộ tới","example":"The pool is within walking distance of our flat."},
      {"term":"look around","kind":"phrasal-verb","en":"to explore a place briefly","vi":"đi xem xung quanh","example":"We looked around the market."}
    ],
    items: [
      {"prompt":"Use who or where. The woman ___ runs the hostel can suggest walks.","keys":["who"],"why":["Runs needs a person as its subject. Who refers to the woman.","Runs cần chủ ngữ chỉ người. Who thay cho the woman."]},
      {"prompt":"“Near the station; lively music until midnight.” Who would this hotel suit best?","options":["A traveller who enjoys late music and needs a train nearby","A traveller who needs silence by nine","A traveller looking for a remote village"],"keys":["A traveller who enjoys late music and needs a train nearby"],"why":["The recommendation follows both clues: location and late noise.","Cần xét cả vị trí gần ga và tiếng nhạc tới khuya."]},
      {"prompt":"Choose where or which. This is the park ___ we used to play football.","keys":["where"],"why":["The children played in the park. Where supplies the place relationship.","Các em chơi bóng trong công viên. Where thể hiện quan hệ nơi chốn."]},
      {"prompt":"Which review gives a reason useful to a wheelchair user?","options":["The tea smells lovely.","The entrance has a ramp and wide doors.","Our waiter told funny stories."],"keys":["The entrance has a ramp and wide doors."],"why":["A ramp and wide doors provide information about physical access.","Đường dốc và cửa rộng cung cấp thông tin về lối vào cho xe lăn."]},
      {"prompt":"“The gallery is within walking distance, but the last part is uphill.” What is the writer warning about?","options":["The gallery is closed.","Walking is impossible.","The walk includes a climb."],"keys":["The walk includes a climb."],"why":["Within walking distance describes how near it is. Uphill adds a difficulty.","Within walking distance nói về khoảng cách. Uphill báo trước một đoạn lên dốc."]}
    ],
    prerequisite: "course-a2-travel-v1"
  },
  {
    id: "course-b1-messages-v1",
    level: "B1",
    kind: "reading",
    title: ["Understanding a change of plan","Hiểu thông báo đổi kế hoạch"],
    objective: ["Identify what changes, what stays the same, and the reason. Because introduces a cause; so introduces a result.","Xác định điều thay đổi, điều giữ nguyên và lý do. Because mở đầu nguyên nhân; so mở đầu kết quả."],
    examples: ["The hall is closed, so the class will meet outside.","Bring your usual book because the lesson content is the same."],
    lexicon: [
      {"term":"postpone","kind":"word","en":"to move an event to a later time","vi":"hoãn lại","example":"They postponed the match until Friday."},
      {"term":"venue","kind":"word","en":"the place where an event happens","vi":"địa điểm tổ chức","example":"The new venue has more seats."},
      {"term":"original","kind":"word","en":"first, before a change","vi":"ban đầu","example":"Keep the original timetable for reference."},
      {"term":"due to","kind":"expression","en":"because of","vi":"do, vì","example":"The gate is shut due to repairs."},
      {"term":"go ahead","kind":"phrasal-verb","en":"to take place as planned","vi":"diễn ra theo kế hoạch","example":"The morning session will go ahead."},
      {"term":"as usual","kind":"expression","en":"in the normal way","vi":"như thường lệ","example":"Meet at the desk as usual."}
    ],
    items: [
      {"prompt":"“The film starts at seven as usual. Due to a leak, please use the side door.” What changes?","options":["The starting time","The way in","The film being shown"],"keys":["The way in"],"why":["As usual keeps the time unchanged. Use the side door changes the entrance.","As usual cho biết giờ vẫn như cũ. Câu sau đổi lối vào."]},
      {"prompt":"Complete with so or because. We need a larger room ___ twelve extra people have registered.","keys":["because"],"why":["The extra registrations are the reason for needing a larger room.","Việc có thêm người đăng ký là nguyên nhân cần phòng lớn hơn."]},
      {"prompt":"“The morning class is postponed until Friday. The afternoon class goes ahead.” Who should still come today?","options":["The morning class","The afternoon class","Both classes at the same time"],"keys":["The afternoon class"],"why":["Goes ahead keeps the afternoon session in place. Only the morning one moves.","Lớp chiều vẫn diễn ra; chỉ lớp sáng được dời lịch."]},
      {"prompt":"Choose so or because. There are no seats left, ___ please wait for the next bus.","keys":["so"],"why":["The request to wait follows from there being no seats.","Hết chỗ là nguyên nhân; yêu cầu chờ xe sau là kết quả nên dùng so."]},
      {"prompt":"“Use your old ticket at the new venue. If you cannot come, email us by noon.” Who needs to email?","options":["People unable to attend","Everyone holding an old ticket","Only those who can attend"],"keys":["People unable to attend"],"why":["The if-clause limits the email request to those who cannot come.","Mệnh đề if giới hạn yêu cầu gửi email cho người không thể đến."]}
    ],
    prerequisite: "course-a2-plans-v1"
  }
];

