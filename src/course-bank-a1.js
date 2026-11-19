// Original Atlas study units. IDs and scoring keys identify this published edition.
export const a1Units = [
  {
    id: "course-a1-introductions-v1",
    level: "A1",
    kind: "grammar",
    title: ["Meeting someone","Làm quen với người mới"],
    objective: ["Use am with I, is with one other person and are with you or we. Ask a name with What is your name?","Dùng am với I, is với một người khác và are với you hoặc we. Hỏi tên bằng What is your name?"],
    examples: ["I am Linh. My name is Linh.","This is Bao. We are friends."],
    lexicon: [
      {"term":"name","kind":"word","en":"the word people call you","vi":"tên","example":"My name is Mai."},
      {"term":"friend","kind":"word","en":"a person you know and like","vi":"bạn","example":"Nam is my friend."},
      {"term":"teacher","kind":"word","en":"a person who helps people learn","vi":"giáo viên","example":"Our teacher is here."},
      {"term":"student","kind":"word","en":"a person who learns at a school","vi":"học sinh, sinh viên","example":"I am a student."},
      {"term":"first name","kind":"collocation","en":"your own name, rather than your family name","vi":"tên riêng","example":"Her first name is Hoa."},
      {"term":"meet","kind":"word","en":"to see and speak to someone for the first time","vi":"gặp, làm quen","example":"It is nice to meet you."}
    ],
    items: [
      {"prompt":"Fill the gap with am, is or are. I ___ Tom.","keys":["am"],"why":["I takes am, even when the name that follows is Tom.","Chủ ngữ I đi với am. Tên Tom ở phía sau không làm thay đổi động từ."]},
      {"prompt":"Mai says, “This is my teacher, Ben.” Who teaches Mai?","options":["Mai","Ben's friend","Ben"],"keys":["Ben"],"why":["My teacher tells us that Ben teaches the speaker, Mai.","Mai giới thiệu “my teacher” nên Ben là người dạy Mai."]},
      {"prompt":"Use am, is or are. You ___ a student.","keys":["are"],"why":["Use are with you, even when speaking to one person.","You vẫn đi với are khi chỉ một người."]},
      {"prompt":"You want to learn a new friend's name. What do you ask?","options":["Where is my bag?","How old is the school?","What is your name?"],"keys":["What is your name?"],"why":["What is your name asks what to call someone.","Câu What is your name? dùng để hỏi tên người đối diện."]},
      {"prompt":"“We are students.” How many students does we include?","options":["Only the speaker","Only the listener","The speaker and at least one other person"],"keys":["The speaker and at least one other person"],"why":["We always includes the speaker and someone else.","We gồm người nói và ít nhất một người khác."]}
    ]
  },
  {
    id: "course-a1-family-v1",
    level: "A1",
    kind: "communication",
    title: ["Whose family is it?","Đó là gia đình của ai?"],
    objective: ["Use my, your, his or her before a family word. In Lan's brother, the ending 's links the brother to Lan.","Đặt my, your, his hoặc her trước từ chỉ người thân. Trong Lan's brother, 's cho biết đó là anh hoặc em trai của Lan."],
    examples: ["I live with my mother.","This is Hoa. Her brother is six."],
    lexicon: [
      {"term":"family","kind":"word","en":"people such as your parents and children","vi":"gia đình","example":"My family is small."},
      {"term":"sister","kind":"word","en":"a girl or woman who has a parent in common with you","vi":"chị hoặc em gái","example":"My sister is ten."},
      {"term":"brother","kind":"word","en":"a boy or man who has a parent in common with you","vi":"anh hoặc em trai","example":"Her brother likes milk."},
      {"term":"father","kind":"word","en":"a male parent","vi":"bố, cha","example":"My father is at home."},
      {"term":"mother","kind":"word","en":"a female parent","vi":"mẹ","example":"Lan's mother is a teacher."},
      {"term":"child","kind":"word","en":"a young person; also a son or daughter","vi":"trẻ em; con của ai đó","example":"They have one child."}
    ],
    items: [
      {"prompt":"An says, “My sister is called Ly.” Who is Ly?","options":["An's mother","An's sister","An's teacher"],"keys":["An's sister"],"why":["My tells us that Ly is the speaker's sister.","My cho biết Ly là chị hoặc em gái của người nói, tức của An."]},
      {"prompt":"Use his or her. Here is Mr Binh. ___ son is called Minh.","keys":["His"],"why":["The father is Mr Binh, so his links the son to him.","His cho biết Minh là con trai của ông Bình."]},
      {"prompt":"You point to a photo and ask a friend about their family. Which question fits?","options":["Is this my child?","Is this your mother?","Is this her school?"],"keys":["Is this your mother?"],"why":["Your refers to the person looking at the photo with you.","Your chỉ người đang xem ảnh cùng bạn."]},
      {"prompt":"Write the family word. My mother has two children: me and a girl called Thu. Thu is my ___.","keys":["sister"],"why":["Two children of the same mother are siblings. The girl is your sister.","Hai người con cùng mẹ là anh chị em. Thu là con gái nên dùng sister."]},
      {"prompt":"“Nam's father is a teacher. Nam is a student.” Who is the teacher?","options":["Nam's father","Nam","Nam's student"],"keys":["Nam's father"],"why":["The 's connects father to Nam. The word after 's is the person described.","'s nối father với Nam. Câu đầu nói về bố của Nam."]}
    ],
    prerequisite: "course-a1-introductions-v1"
  },
  {
    id: "course-a1-rooms-v1",
    level: "A1",
    kind: "grammar",
    title: ["Finding things at home","Tìm đồ vật trong nhà"],
    objective: ["Say there is for one thing and there are for more than one. In means inside; on means touching a surface.","Dùng there is khi có một vật và there are khi có nhiều vật. In nghĩa là ở trong; on nghĩa là ở trên một bề mặt."],
    examples: ["There is a cup on the table.","There are two books in the bag."],
    lexicon: [
      {"term":"room","kind":"word","en":"one part of a home with walls around it","vi":"căn phòng","example":"My room has a small window."},
      {"term":"key","kind":"word","en":"a small thing that opens a lock","vi":"chìa khóa","example":"The key is in my pocket."},
      {"term":"box","kind":"word","en":"a container with firm sides","vi":"cái hộp","example":"Open the red box."},
      {"term":"chair","kind":"word","en":"a seat for one person","vi":"ghế","example":"There are three chairs."},
      {"term":"table","kind":"word","en":"a piece of furniture with a flat top","vi":"cái bàn","example":"The milk is on the table."},
      {"term":"bag","kind":"word","en":"something you carry things in","vi":"cái túi","example":"My bag is blue."}
    ],
    items: [
      {"prompt":"Choose is or are. There ___ three keys in the box.","keys":["are"],"why":["Three keys is plural, so the sentence starts There are.","Three keys là số nhiều nên dùng There are."]},
      {"prompt":"“The cup is on the chair.” Where do you look?","options":["Inside the bag","Under the table","On the seat"],"keys":["On the seat"],"why":["On the chair puts the cup on its surface.","On the chair nghĩa là cốc nằm trên mặt ghế."]},
      {"prompt":"Choose in or on. I open my closed bag and take the pen out. The pen was ___ the bag.","keys":["in"],"why":["Take it out tells us the pen was inside the bag.","Take it out cho biết bút đã nằm bên trong túi."]},
      {"prompt":"Which sentence describes one book on a desk?","options":["There are a book on the desk.","There is two books on the desk.","There is a book on the desk."],"keys":["There is a book on the desk."],"why":["One book takes a and is, rather than the plural form are.","Một cuốn sách dùng a book và is."]},
      {"prompt":"“There is a chair in my room. My bag is on it.” What does it mean here?","options":["The bag","The door","The chair"],"keys":["The chair"],"why":["The bag rests on the chair mentioned in the first sentence.","Chiếc túi nằm trên chiếc ghế vừa được nhắc đến."]}
    ]
  },
  {
    id: "course-a1-breakfast-v1",
    level: "A1",
    kind: "grammar",
    title: ["Food for breakfast","Đồ ăn sáng"],
    objective: ["Use a or an with one countable thing. Use some with an amount of food or drink. Would you like …? offers something.","Dùng a hoặc an với một vật đếm được. Dùng some khi nói một lượng đồ ăn hay thức uống. Would you like …? dùng để mời."],
    examples: ["An egg and some rice, please.","Would you like some water?"],
    lexicon: [
      {"term":"egg","kind":"word","en":"food in a shell, usually from a hen","vi":"quả trứng","example":"I eat an egg for breakfast."},
      {"term":"rice","kind":"word","en":"small grains we cook and eat","vi":"gạo; cơm","example":"We have rice and fish."},
      {"term":"bread","kind":"word","en":"food baked from flour, often cut into slices","vi":"bánh mì","example":"There is bread on the plate."},
      {"term":"milk","kind":"word","en":"a drink often from a cow","vi":"sữa","example":"Please put the milk in the fridge."},
      {"term":"water","kind":"word","en":"the clear liquid we drink","vi":"nước","example":"I drink water with lunch."},
      {"term":"slice of bread","kind":"collocation","en":"one flat piece cut from a loaf","vi":"một lát bánh mì","example":"He takes a slice of bread."}
    ],
    items: [
      {"prompt":"Write a or an. I'd like ___ apple, please.","keys":["an"],"why":["Apple begins with a vowel sound, so use an.","Apple bắt đầu bằng nguyên âm nên dùng an."]},
      {"prompt":"You pour milk from a bottle. What do you say?","options":["I'd like some milk.","I'd like a milk grain.","I'd like an milk."],"keys":["I'd like some milk."],"why":["Some milk asks for an amount of the drink.","Some milk chỉ một lượng sữa."]},
      {"prompt":"A friend asks, “Would you like an egg?” You want one. What fits?","options":["It's in my bag.","My name is Jo.","Yes, please."],"keys":["Yes, please."],"why":["Yes, please politely accepts an offer.","Yes, please là lời nhận khi được mời."]},
      {"prompt":"Use the singular or plural of egg. I need two ___ for breakfast.","keys":["eggs"],"why":["Two needs the plural form eggs.","Sau two cần danh từ số nhiều eggs."]},
      {"prompt":"Which order asks for one piece of bread?","options":["Some rice, please.","A slice of bread, please.","A glass of milk, please."],"keys":["A slice of bread, please."],"why":["A slice is one flat piece cut from a loaf.","A slice chỉ một lát được cắt ra từ ổ bánh."]}
    ]
  },
  {
    id: "course-a1-routine-v1",
    level: "A1",
    kind: "grammar",
    title: ["A usual morning","Một buổi sáng thường ngày"],
    objective: ["For a routine, use the simple present. With he or she, most verbs take -s. A question with does uses the base verb.","Dùng hiện tại đơn cho việc thường làm. Với he và she, phần lớn động từ thêm -s. Sau does trong câu hỏi dùng động từ nguyên mẫu."],
    examples: ["I start at eight. My sister starts at nine.","Does she walk to class?"],
    lexicon: [
      {"term":"wake up","kind":"phrasal-verb","en":"to stop sleeping","vi":"thức dậy","example":"I wake up at seven."},
      {"term":"walk","kind":"word","en":"to go somewhere on foot","vi":"đi bộ","example":"We walk to school."},
      {"term":"start","kind":"word","en":"to begin","vi":"bắt đầu","example":"Lessons start at eight."},
      {"term":"finish","kind":"word","en":"to come to the end","vi":"kết thúc","example":"I finish school at three."},
      {"term":"breakfast","kind":"word","en":"the first meal of the day","vi":"bữa sáng","example":"Breakfast is ready."},
      {"term":"every morning","kind":"expression","en":"on each morning","vi":"mỗi buổi sáng","example":"He calls his dad every morning."}
    ],
    items: [
      {"prompt":"Use the correct form of walk. Every day Trang ___ home with her dad.","keys":["walks"],"why":["Trang is one person. Add -s in a positive simple present sentence.","Trang là một người nên trong câu khẳng định hiện tại đơn dùng walks."]},
      {"prompt":"Which question asks about a routine?","options":["Is he breakfast?","Has he a table now?","Does he eat breakfast at home?"],"keys":["Does he eat breakfast at home?"],"why":["Does + he + eat asks about a repeated action.","Does + he + eat dùng để hỏi về thói quen."]},
      {"prompt":"Use start in the correct form. Does your class ___ at nine?","keys":["start"],"why":["Does already marks the question. The next verb stays in its base form.","Does đã mang dấu hiệu ngôi và thì. Động từ theo sau giữ nguyên."]},
      {"prompt":"“I wake up at six. I eat at seven.” What comes first?","options":["Eating","Going to bed","Waking up"],"keys":["Waking up"],"why":["Six comes before seven in this morning routine.","Trong buổi sáng, sáu giờ đến trước bảy giờ."]},
      {"prompt":"Choose the sentence for two people who go to school on foot.","options":["They walks to school.","They is walk to school.","They walk to school."],"keys":["They walk to school."],"why":["They takes walk. Only he, she or it takes walks here.","They đi với walk. Trong trường hợp này chỉ he, she hoặc it đi với walks."]}
    ],
    prerequisite: "course-a1-introductions-v1"
  },
  {
    id: "course-a1-time-v1",
    level: "A1",
    kind: "communication",
    title: ["Days and times","Ngày và giờ"],
    objective: ["Use at with a clock time and on with a day. From … to … gives the start and the end.","Dùng at trước giờ và on trước ngày. From … to … cho biết lúc bắt đầu và kết thúc."],
    examples: ["The shop opens at ten on Monday.","We study from two to three."],
    lexicon: [
      {"term":"today","kind":"word","en":"the day it is now","vi":"hôm nay","example":"Today is Friday."},
      {"term":"tomorrow","kind":"word","en":"the day after today","vi":"ngày mai","example":"See you tomorrow."},
      {"term":"morning","kind":"word","en":"the early part of the day","vi":"buổi sáng","example":"I read in the morning."},
      {"term":"afternoon","kind":"word","en":"the part of the day after noon and before evening","vi":"buổi chiều","example":"We play in the afternoon."},
      {"term":"open","kind":"word","en":"ready for people to come in","vi":"mở cửa","example":"The shop is open."},
      {"term":"closed","kind":"word","en":"not open for people to enter","vi":"đóng cửa","example":"The pool is closed today."}
    ],
    items: [
      {"prompt":"Use on or at. The shop opens ___ nine.","keys":["at"],"why":["Nine is a clock time here, so we say at nine.","Nine ở đây là giờ cụ thể nên dùng at nine."]},
      {"prompt":"“Class: Tuesday, 2–3 in the afternoon.” When does class finish?","options":["At three in the afternoon","At two in the afternoon","On Wednesday"],"keys":["At three in the afternoon"],"why":["The second time in the range is the finish time.","Trong khoảng 2–3 giờ, mốc thứ hai là giờ kết thúc."]},
      {"prompt":"Use on or at. We play football ___ Sunday.","keys":["on"],"why":["Use on before the name of a day.","Dùng on trước tên ngày trong tuần."]},
      {"prompt":"It is Monday. A sign says “Closed today. Open tomorrow.” When can you go in?","options":["Monday","Sunday","Tuesday"],"keys":["Tuesday"],"why":["Tomorrow means the day after Monday, which is Tuesday.","Ngày sau thứ Hai là thứ Ba."]},
      {"prompt":"“The café is open from eight to ten this morning.” Which time is inside those hours?","options":["Seven this morning","Nine this morning","Two this afternoon"],"keys":["Nine this morning"],"why":["Nine is after eight and before ten.","Chín giờ nằm giữa tám giờ và mười giờ sáng."]}
    ],
    prerequisite: "course-a1-routine-v1"
  }
];

