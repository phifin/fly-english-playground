// Original Atlas study units. IDs and scoring keys identify this published edition.
export const a2Units = [
  {
    id: "course-a2-directions-v1",
    level: "A2",
    kind: "communication",
    title: ["Finding the right street","Tìm đúng đường"],
    objective: ["Use turn for a change of direction, past for a place you leave behind, and opposite for a place across from you.","Dùng turn khi đổi hướng, past khi đi ngang qua và opposite khi nói một nơi ở phía đối diện."],
    examples: ["Walk past the bank. Turn left at the park.","Our shop is opposite the station."],
    lexicon: [
      {"term":"turn left","kind":"collocation","en":"to change direction to your left","vi":"rẽ trái","example":"Turn left at the lights."},
      {"term":"corner","kind":"word","en":"where two streets meet","vi":"góc đường","example":"Meet me on the corner."},
      {"term":"opposite","kind":"word","en":"on the other side, facing something","vi":"đối diện","example":"The café is opposite the park."},
      {"term":"cross","kind":"word","en":"to go from one side to the other","vi":"băng qua","example":"Cross the road here."},
      {"term":"straight ahead","kind":"expression","en":"forward without turning","vi":"đi thẳng","example":"Go straight ahead to the gate."},
      {"term":"station","kind":"word","en":"a place where trains stop","vi":"nhà ga","example":"We meet outside the station."}
    ],
    items: [
      {"prompt":"“Go past the bank. Stop at the library.” Where should you stop?","options":["Inside the bank","At the library","Before you reach the bank"],"keys":["At the library"],"why":["Past tells you to keep moving at the bank. Stop at names your destination.","Past nghĩa là đi qua ngân hàng. Stop at cho biết nơi dừng."]},
      {"prompt":"Use opposite or inside. We are on different sides of the road. The cinema faces the school. It is ___ the school.","keys":["opposite"],"why":["The buildings face each other across the road.","Hai tòa nhà nhìn sang nhau qua con đường nên dùng opposite."]},
      {"prompt":"Which direction tells you to stay on the same road without turning?","options":["Turn right now.","Take the first left.","Go straight ahead."],"keys":["Go straight ahead."],"why":["Straight ahead means continue in the same direction.","Straight ahead nghĩa là tiếp tục theo hướng hiện tại."]},
      {"prompt":"Choose cross or turn. Start on this side of the bridge. Walk to the other side: ___ the bridge.","keys":["cross"],"why":["Cross the bridge means travel from one side to the other.","Cross the bridge nghĩa là đi từ đầu cầu này sang đầu cầu kia."]},
      {"prompt":"“The shop is between the bank and the school.” What do you know?","options":["The shop has the bank on one side and the school on the other.","The school is inside the bank.","The shop is opposite both places across a river."],"keys":["The shop has the bank on one side and the school on the other."],"why":["Between describes a position with a place on either side.","Between chỉ vị trí ở giữa hai địa điểm."]}
    ],
    prerequisite: "course-a1-rooms-v1"
  },
  {
    id: "course-a2-shopping-v1",
    level: "A2",
    kind: "grammar",
    title: ["Making a shopping list","Lên danh sách mua đồ"],
    objective: ["Use how many with things you count, and how much with an amount. A bottle or a kilo gives an amount you can count.","Dùng how many để hỏi số lượng đồ đếm được và how much để hỏi một lượng. Có thể đếm số chai hoặc số ki-lô-gam."],
    examples: ["How many oranges do we need?","How much juice is left? One bottle."],
    lexicon: [
      {"term":"bottle","kind":"word","en":"a container for a drink or other liquid","vi":"cái chai","example":"Buy a bottle of water."},
      {"term":"kilo","kind":"word","en":"a unit for measuring weight","vi":"ki-lô-gam","example":"We need a kilo of rice."},
      {"term":"price","kind":"word","en":"the money you pay for something","vi":"giá","example":"The price is on the box."},
      {"term":"change","kind":"word","en":"money you get back when you give more than the price","vi":"tiền thừa được trả lại","example":"Keep your change in your pocket."},
      {"term":"shopping list","kind":"collocation","en":"a note of things you want to buy","vi":"danh sách mua sắm","example":"Eggs are on my shopping list."},
      {"term":"run out of","kind":"phrasal-verb","en":"to have none left","vi":"hết, dùng hết","example":"We have run out of sugar."}
    ],
    items: [
      {"prompt":"Complete with many or much. How ___ apples are in the bag?","keys":["many"],"why":["Apples are separate countable things. Use how many.","Có thể đếm từng quả táo nên dùng how many."]},
      {"prompt":"“We have run out of milk but still have eggs.” Which item should go on the list?","options":["Milk","Eggs","Both items equally"],"keys":["Milk"],"why":["Run out of milk means there is none left. The eggs remain.","Run out of milk nghĩa là hết sữa. Trứng thì vẫn còn."]},
      {"prompt":"Complete with many or much. How ___ sugar do you want in your tea?","keys":["much"],"why":["Sugar here is an amount, so ask how much.","Sugar ở đây là một lượng đường nên hỏi bằng how much."]},
      {"prompt":"Your friend asks how many bottles to buy. Which answer fits?","options":["It costs three pounds.","Two, please.","It tastes sweet."],"keys":["Two, please."],"why":["Two gives a number of bottles. A price or taste answers a different question.","Two cho biết số chai; giá và hương vị không trả lời câu hỏi này."]},
      {"prompt":"You pay for a bag and the shopkeeper hands some coins back. What are the coins?","options":["Your change","Your shopping list","The weight of the bag"],"keys":["Your change"],"why":["Change is the extra money returned after a payment.","Change là phần tiền thừa được trả lại sau khi thanh toán."]}
    ],
    prerequisite: "course-a1-breakfast-v1"
  },
  {
    id: "course-a2-last-weekend-v1",
    level: "A2",
    kind: "grammar",
    title: ["Telling a short story","Kể chuyện cuối tuần"],
    objective: ["Use the past simple for a finished time. Some verbs change form, as in come → came. After did or didn't, use the base verb.","Dùng quá khứ đơn cho thời gian đã kết thúc. Một số động từ đổi dạng như come → came. Sau did hoặc didn't, dùng động từ nguyên mẫu."],
    examples: ["We visited a friend yesterday. She took us to the park.","Did you enjoy it? We didn't stay long."],
    lexicon: [
      {"term":"yesterday","kind":"word","en":"the day before today","vi":"hôm qua","example":"I saw her yesterday."},
      {"term":"visit","kind":"word","en":"to go and spend time with someone or at a place","vi":"đến thăm","example":"We visit our cousins in June."},
      {"term":"stay","kind":"word","en":"to continue to be in a place","vi":"ở lại","example":"We stayed for lunch."},
      {"term":"take a photo","kind":"collocation","en":"to use a camera to make a picture","vi":"chụp ảnh","example":"Can I take a photo of the cake?"},
      {"term":"come back","kind":"phrasal-verb","en":"to return","vi":"quay về","example":"They came back before dark."},
      {"term":"last weekend","kind":"expression","en":"the most recent Saturday and Sunday in the past","vi":"cuối tuần trước","example":"We went fishing last weekend."}
    ],
    items: [
      {"prompt":"Use go in the past simple. We ___ to the beach last Saturday.","keys":["went"],"why":["Last Saturday is finished. The past form of go is went.","Thứ Bảy tuần trước đã qua. Dạng quá khứ của go là went."]},
      {"prompt":"Which question asks about a finished visit?","options":["Did you see the market?","Do you seeing the market?","Did you saw the market?"],"keys":["Did you see the market?"],"why":["After did, use see rather than saw.","Sau did dùng see, không dùng saw."]},
      {"prompt":"Use visit in the correct form. They didn't ___ the museum on Sunday.","keys":["visit"],"why":["Didn't carries the past tense, leaving visit in the base form.","Didn't đã mang thì quá khứ nên visit giữ nguyên."]},
      {"prompt":"“First we bought bread. Then we went to the river.” What happened later?","options":["They bought bread.","They did both at once.","They went to the river."],"keys":["They went to the river."],"why":["Then moves the story on to the second action.","Then chuyển sang việc xảy ra sau."]},
      {"prompt":"Which answer fits “When did you come back?”","options":["On Sunday evening.","With my brother.","By bus."],"keys":["On Sunday evening."],"why":["When asks about time. With whom and how need different answers.","When hỏi thời gian nên trả lời On Sunday evening."]}
    ],
    prerequisite: "course-a1-routine-v1"
  },
  {
    id: "course-a2-plans-v1",
    level: "A2",
    kind: "grammar",
    title: ["Making a weekend plan","Lên kế hoạch cuối tuần"],
    objective: ["Use am, is or are + going to + a base verb for a plan. Read the day and time carefully when a plan changes.","Dùng am, is hoặc are + going to + động từ nguyên mẫu để nói kế hoạch. Khi kế hoạch thay đổi, hãy chú ý ngày và giờ mới."],
    examples: ["We are going to cook together.","I was free on Saturday, but Sunday is better now."],
    lexicon: [
      {"term":"plan","kind":"word","en":"what you intend to do","vi":"kế hoạch","example":"Our plan is to walk by the river."},
      {"term":"free","kind":"word","en":"available to do something","vi":"rảnh","example":"Are you free on Friday?"},
      {"term":"busy","kind":"word","en":"having things to do","vi":"bận","example":"I'm busy until six."},
      {"term":"bring","kind":"word","en":"to carry something to a person or place","vi":"mang đến","example":"Bring your coat to my house."},
      {"term":"meet up","kind":"phrasal-verb","en":"to get together with someone","vi":"gặp nhau","example":"Let's meet up after lunch."},
      {"term":"instead","kind":"word","en":"in place of something else","vi":"thay vào đó","example":"The park is closed. Let's swim instead."}
    ],
    items: [
      {"prompt":"Complete with am, is or are. My friends ___ going to play on Sunday.","keys":["are"],"why":["Friends is plural, so the plan begins They are going to.","Friends là số nhiều nên dùng are going to."]},
      {"prompt":"“Too wet for a picnic. Let's eat at my flat instead.” What changes?","options":["The reason for meeting","The day of the meal","The place to eat"],"keys":["The place to eat"],"why":["Instead replaces the picnic location with the speaker's flat. The meal still happens.","Instead thay nơi ăn bằng căn hộ của người nói. Mọi người vẫn ăn cùng nhau."]},
      {"prompt":"Use buy in the correct form. I'm going to ___ some fruit for the picnic.","keys":["buy"],"why":["The verb after going to is in its base form.","Sau going to dùng động từ nguyên mẫu buy."]},
      {"prompt":"“Can we meet at four? I'm busy at three.” Which time does the speaker suggest?","options":["Three","Before three","Four"],"keys":["Four"],"why":["At four is the proposal. At three is the time the speaker cannot meet.","Bốn giờ là giờ được đề xuất. Ba giờ người nói đang bận."]},
      {"prompt":"Which sentence clearly gives an intention?","options":["I'm going to paint my room tomorrow.","I painted my room yesterday.","My room has two chairs."],"keys":["I'm going to paint my room tomorrow."],"why":["Going to and tomorrow tell us what the speaker plans to do.","Going to và tomorrow cho biết việc người nói dự định làm."]}
    ],
    prerequisite: "course-a1-time-v1"
  },
  {
    id: "course-a2-invites-v1",
    level: "A2",
    kind: "communication",
    title: ["Accepting and declining","Nhận lời và từ chối"],
    objective: ["Would you like to + a verb invites someone. Accept clearly, or say you can't and suggest another time if you want to meet.","Would you like to + động từ dùng để mời. Có thể nhận lời hoặc nói mình không đi được rồi đề xuất lúc khác nếu vẫn muốn gặp."],
    examples: ["Would you like to join us for lunch?","I'd love to, but I'm working. How about tomorrow?"],
    lexicon: [
      {"term":"invite","kind":"word","en":"to ask someone to come to an event","vi":"mời","example":"We invited Mai to dinner."},
      {"term":"join","kind":"word","en":"to do something together with others","vi":"tham gia cùng","example":"Can you join us for the walk?"},
      {"term":"guest","kind":"word","en":"a person invited to a place or event","vi":"khách được mời","example":"Each guest can bring a friend."},
      {"term":"let me know","kind":"expression","en":"tell me when you have the information","vi":"báo cho mình biết","example":"Let me know by Friday."},
      {"term":"make it","kind":"idiom","en":"to be able to attend or arrive","vi":"đến được, tham dự được","example":"I can't make it tonight."},
      {"term":"another time","kind":"expression","en":"on a different occasion","vi":"dịp khác","example":"Let's try another time."}
    ],
    items: [
      {"prompt":"A friend offers you a place at dinner. You can go and want to accept. Which reply fits?","options":["I can't make it.","What time did you leave yesterday?","Yes, I'd love to."],"keys":["Yes, I'd love to."],"why":["I'd love to clearly accepts an invitation in this context.","Trong ngữ cảnh này, I'd love to là lời nhận lời."]},
      {"prompt":"Choose to or at. Would you like ___ come to my party?","keys":["to"],"why":["Use would like to followed by a verb.","Dùng would like to trước động từ."]},
      {"prompt":"“Thanks for asking. I can't make it on Friday. Is Saturday possible?” What does the writer mean?","options":["They want to meet on a different day.","They have accepted Friday.","They never want to meet."],"keys":["They want to meet on a different day."],"why":["Saturday is an alternative to Friday. The writer is still interested in meeting.","Thứ Bảy là lời đề nghị thay cho thứ Sáu, nên người viết vẫn muốn gặp."]},
      {"prompt":"Use join in the correct form. Can your cousin ___ us for lunch?","keys":["join"],"why":["Can is followed by the base form join.","Sau can dùng động từ nguyên mẫu join."]},
      {"prompt":"“Let me know by Tuesday if you're coming on Friday.” What must happen by Tuesday?","options":["Go to the event","Send an answer","Bring the food"],"keys":["Send an answer"],"why":["Tuesday is the reply deadline. Friday is the event date.","Thứ Ba là hạn trả lời. Buổi gặp diễn ra vào thứ Sáu."]}
    ],
    prerequisite: "course-a2-plans-v1"
  },
  {
    id: "course-a2-travel-v1",
    level: "A2",
    kind: "grammar",
    title: ["Choosing a way to travel","Chọn phương tiện đi lại"],
    objective: ["Compare two choices with -er or more + adjective, followed by than. Use the information given to decide what suits a traveller.","So sánh hai lựa chọn bằng tính từ thêm -er hoặc more + tính từ, rồi dùng than. Dựa vào thông tin đã cho để chọn cách đi phù hợp."],
    examples: ["The bus is cheaper than the taxi.","This seat is more comfortable than that one."],
    lexicon: [
      {"term":"fare","kind":"word","en":"the money paid for a journey","vi":"tiền vé","example":"The train fare is six pounds."},
      {"term":"cheap","kind":"word","en":"costing little money","vi":"rẻ","example":"The bus ticket is cheap."},
      {"term":"fast","kind":"word","en":"moving quickly","vi":"nhanh","example":"The fast train stops only once."},
      {"term":"comfortable","kind":"word","en":"pleasant to sit in or use","vi":"thoải mái","example":"These seats are comfortable."},
      {"term":"single ticket","kind":"collocation","en":"a ticket to travel one way","vi":"vé một chiều","example":"I'd like a single ticket to Bath."},
      {"term":"get off","kind":"phrasal-verb","en":"to leave a bus or train","vi":"xuống xe, tàu","example":"Get off at the next stop."}
    ],
    items: [
      {"prompt":"Use the comparative of cheap. The bus costs less. It is ___ than the train.","keys":["cheaper"],"why":["For cheap, add -er to compare prices.","Cheap thêm -er để so sánh giá."]},
      {"prompt":"“Bus: 20 minutes, £2. Train: 10 minutes, £5.” You have £3. Which can you take?","options":["Only the train","Only the bus","Either one"],"keys":["Only the bus"],"why":["The bus is within your budget. The train costs more than £3.","Vé xe buýt nằm trong số tiền bạn có. Vé tàu đắt hơn 3 bảng."]},
      {"prompt":"Choose than or then. This taxi is faster ___ the bus.","keys":["than"],"why":["Than introduces the other thing being compared.","Than đứng trước đối tượng thứ hai trong phép so sánh."]},
      {"prompt":"“Get off at Mill Road, then walk to the hall.” What do you do at Mill Road?","options":["Buy a return ticket","Leave the bus","Get on the train"],"keys":["Leave the bus"],"why":["Get off means leave the vehicle you are travelling on.","Get off là xuống phương tiện đang đi."]},
      {"prompt":"Which request is for a trip out with no journey back on the same ticket?","options":["A single ticket, please.","A return ticket, please.","Two return tickets, please."],"keys":["A single ticket, please."],"why":["A single ticket covers one direction only.","Single ticket là vé cho một chiều đi."]}
    ],
    prerequisite: "course-a1-time-v1"
  }
];

