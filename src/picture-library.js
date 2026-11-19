import {littleWords} from './little-content.js';

// Atlas originals. IDs and topic order are append-only because saved games refer to them.
const picture=(id,vi,exampleEn,exampleVi,tipEn,tipVi)=>{
 const en=id==='teddy-bear'?'teddy bear':id;
 return {id,word:{en,vi},cue:{en:'Find the '+en+'.',vi:'Tìm '+vi+' nhé.'},
  example:{en:exampleEn,vi:exampleVi},parentTip:{en:tipEn,vi:tipVi}};
};
export const pictureTopics=[
 {id:'first',name:{en:'First pictures',vi:'Những bức tranh đầu tiên'},words:littleWords},
 {id:'farm',name:{en:'Animal friends',vi:'Những bạn động vật'},words:[
  picture("rabbit", "con thỏ", "The rabbit hops.", "Thỏ nhảy từng bước.", "Bend two fingers like long ears, then let them hop.", "Dùng hai ngón tay làm tai dài rồi cho thỏ nhảy."),
  picture("frog", "con ếch", "The frog sits by the water.", "Ếch ngồi bên mép nước.", "Crouch together and make a little frog jump.", "Cùng ngồi xổm rồi bật nhẹ như ếch."),
  picture("turtle", "con rùa", "The turtle has a shell.", "Rùa có mai.", "Curl a hand over your other hand to make a shell.", "Úp bàn tay lên tay kia để làm mai rùa."),
  picture("duck", "con vịt", "A duck swims in the pond.", "Một con vịt bơi trong ao.", "Paddle your hands and say “duck” together.", "Cùng khua tay như vịt bơi và nói “duck”."),
  picture("cow", "con bò", "The cow eats grass.", "Bò ăn cỏ.", "Point to the cow and pretend to chew grass.", "Chỉ vào con bò rồi giả vờ nhai cỏ."),
  picture("pig", "con lợn", "The pig has a pink nose.", "Chú lợn có chiếc mũi hồng.", "Touch your nose and make a gentle snorting sound.", "Chạm vào mũi mình rồi cùng bắt chước tiếng lợn khụt khịt."),
  picture("sheep", "con cừu", "The sheep has thick wool.", "Cừu có bộ lông len dày.", "Trace the wavy edge of the wool in the picture.", "Cùng lần theo nét lượn sóng trên bộ lông cừu trong tranh."),
  picture("horse", "con ngựa", "The horse has a long tail.", "Ngựa có đuôi dài.", "Tap two fingers on the table like hooves.", "Gõ nhẹ hai ngón tay lên bàn như tiếng vó ngựa."),
 ]},
 {id:'food',name:{en:'At the market',vi:'Đi chợ'},words:[
  picture("carrot", "củ cà rốt", "The carrot is orange.", "Củ cà rốt có màu cam.", "Find the green top and trace the pointed end.", "Tìm phần lá xanh rồi lần theo hình củ đến đầu nhọn."),
  picture("corn", "bắp ngô", "Corn grows on a tall plant.", "Bắp ngô mọc trên cây cao.", "Trace one row of yellow kernels with your finger.", "Dùng ngón tay lần theo một hàng hạt ngô vàng."),
  picture("egg", "quả trứng", "An egg has a shell.", "Quả trứng có vỏ.", "Cup your palms as if you were holding an egg.", "Khép hai lòng bàn tay như đang nâng một quả trứng."),
  picture("bread", "bánh mì", "I cut a slice of bread.", "Mình cắt một lát bánh mì.", "Pretend to spread butter on a slice of bread together.", "Cùng giả vờ phết bơ lên một lát bánh mì."),
  picture("cheese", "phô mai", "I put cheese on my bread.", "Mình đặt phô mai lên bánh mì.", "Pretend to make a sandwich with a piece of cheese.", "Cùng giả vờ kẹp một miếng phô mai vào bánh mì."),
  picture("grapes", "nho", "The grapes grow in a bunch.", "Nho mọc thành chùm.", "Point to one grape, then sweep your finger around the whole bunch.", "Chỉ một quả nho, rồi dùng ngón tay khoanh quanh cả chùm trong tranh."),
  picture("watermelon", "dưa hấu", "The watermelon is red inside.", "Dưa hấu có ruột đỏ.", "Trace the curved green rind around the red fruit.", "Lần theo phần vỏ xanh ôm lấy miếng dưa đỏ."),
  picture("strawberry", "quả dâu tây", "The strawberry has tiny seeds.", "Quả dâu tây có nhiều hạt nhỏ.", "Pretend to pick a strawberry gently from a plant.", "Cùng giả vờ nhẹ nhàng hái một quả dâu tây."),
 ]},
 {id:'home',name:{en:'Around the house',vi:'Đồ dùng trong nhà'},words:[
  picture("spoon", "cái thìa", "I stir soup with a spoon.", "Mình khuấy súp bằng thìa.", "Pretend to stir soup in slow circles.", "Giả vờ khuấy súp theo vòng tròn thật chậm."),
  picture("fork", "cái nĩa", "I pick up a piece of fruit with my fork.", "Mình dùng nĩa xiên một miếng trái cây.", "Spread three fingers like the prongs of a fork.", "Xòe ba ngón tay làm răng nĩa."),
  picture("plate", "cái đĩa", "The bread is on the plate.", "Bánh mì nằm trên đĩa.", "Trace the round rim, then pretend to put lunch on the plate.", "Lần theo vành đĩa rồi giả vờ bày bữa trưa lên."),
  picture("bowl", "cái bát", "I eat rice from a bowl.", "Mình ăn cơm trong bát.", "Make a bowl with your hands and pretend to fill it.", "Khum hai tay thành cái bát rồi giả vờ cho cơm vào."),
  picture("chair", "cái ghế", "I sit on a chair.", "Mình ngồi trên ghế.", "Invite your child to find a chair nearby and point to its seat.", "Mời bé tìm một chiếc ghế gần đó rồi chỉ vào chỗ ngồi."),
  picture("bed", "cái giường", "My blanket is on the bed.", "Chăn của mình ở trên giường.", "Pretend to tuck a toy into bed together.", "Cùng giả vờ đắp chăn cho đồ chơi đi ngủ."),
  picture("lamp", "đèn bàn", "The lamp lights my book.", "Đèn bàn chiếu sáng trang sách.", "Pretend to switch the lamp on and open a book.", "Giả vờ bật đèn rồi mở sách ra đọc."),
  picture("clock", "đồng hồ", "The clock has two hands.", "Chiếc đồng hồ có hai kim.", "Hold your arms at different angles like clock hands.", "Dang hai tay theo hai hướng như kim đồng hồ."),
 ]},
 {id:'clothes',name:{en:'Getting dressed',vi:'Mặc quần áo'},words:[
  picture("hat", "cái mũ", "I wear a hat on my head.", "Mình đội mũ trên đầu.", "Pretend to put on a hat and give its brim a little tap.", "Giả vờ đội mũ rồi gõ nhẹ vào vành mũ."),
  picture("sock", "chiếc tất", "A sock keeps my foot warm.", "Chiếc tất giữ ấm bàn chân mình.", "Point to one foot and pretend to pull on a sock.", "Chỉ bàn chân rồi giả vờ kéo tất lên."),
  picture("coat", "áo khoác", "I put on my coat to go outside.", "Mình mặc áo khoác để ra ngoài.", "Mime sliding your arms into the sleeves.", "Giả vờ luồn tay vào hai ống tay áo."),
  picture("dress", "váy liền", "The dress has a wide skirt.", "Chiếc váy liền có phần chân váy xòe rộng.", "Trace the outline from the shoulders down to the hem.", "Lần theo mép chiếc váy từ vai xuống gấu váy."),
  picture("scarf", "khăn quàng cổ", "My scarf is long and soft.", "Khăn quàng cổ của mình dài và mềm.", "Point to the fringes, then pretend to drape a scarf over your shoulders.", "Chỉ tua khăn rồi giả vờ vắt khăn qua vai."),
  picture("gloves", "đôi găng tay", "My gloves keep my fingers warm.", "Đôi găng giữ ấm các ngón tay mình.", "Spread your fingers, then pretend to put a glove on each hand.", "Xòe các ngón tay rồi giả vờ đeo găng vào từng bàn tay."),
  picture("trousers", "quần dài", "My trousers have two legs.", "Chiếc quần dài của mình có hai ống.", "Point to the two trouser legs in the picture.", "Cùng chỉ vào hai ống quần trong tranh."),
  picture("boots", "đôi ủng", "I wear boots in the rain.", "Mình mang ủng khi trời mưa.", "Pretend to step through a puddle in boots.", "Giả vờ đi ủng bước qua một vũng nước."),
 ]},
 {id:'travel',name:{en:'On the move',vi:'Phương tiện đi lại'},words:[
  picture("car", "ô tô", "The car stops at the red light.", "Ô tô dừng khi đèn đỏ.", "Turn an imaginary steering wheel together.", "Cùng xoay một chiếc vô lăng tưởng tượng."),
  picture("bus", "xe buýt", "The bus picks up people at the stop.", "Xe buýt đón khách tại trạm.", "Pretend to open the bus door and welcome a passenger.", "Giả vờ mở cửa xe buýt và đón một hành khách."),
  picture("train", "tàu hỏa", "The train runs on tracks.", "Tàu hỏa chạy trên đường ray.", "Draw two parallel tracks with your fingers.", "Dùng hai ngón tay vẽ hai đường ray song song."),
  picture("bicycle", "xe đạp", "My bicycle has two wheels.", "Xe đạp của mình có hai bánh.", "Make circles with your hands like turning pedals.", "Xoay hai tay theo vòng tròn như đang đạp xe."),
  picture("plane", "máy bay", "The plane flies above the clouds.", "Máy bay bay phía trên những đám mây.", "Spread your arms into wings and tilt gently.", "Dang hai tay làm cánh rồi nghiêng người nhẹ nhàng."),
  picture("truck", "xe tải", "The truck carries boxes.", "Xe tải chở các thùng hàng.", "Pretend to load a box into the back of the truck.", "Giả vờ xếp một thùng hàng lên thùng xe tải."),
  picture("helicopter", "trực thăng", "The helicopter has blades that spin.", "Trực thăng có cánh quạt quay.", "Trace a circle above the picture to show the blades turning.", "Vẽ một vòng tròn phía trên tranh để mô tả cánh quạt đang quay."),
  picture("scooter", "xe trượt", "I push my scooter with one foot.", "Mình dùng một chân đẩy xe trượt đi.", "Point to the footboard and pretend to hold the handlebars.", "Chỉ chỗ đặt chân rồi giả vờ nắm tay lái."),
 ]},
 {id:'garden',name:{en:'In the garden',vi:'Trong vườn'},words:[
  picture("tree", "cây", "Birds sit in the tree.", "Chim đậu trên cây.", "Stretch your arms up and spread them like branches.", "Giơ hai tay lên rồi dang ra như cành cây."),
  picture("flower", "bông hoa", "A bee lands on the flower.", "Ong đậu lên bông hoa.", "Open your fingers slowly like petals opening.", "Từ từ xòe bàn tay như những cánh hoa đang nở."),
  picture("mushroom", "cây nấm", "A mushroom grows beside the tree.", "Một cây nấm mọc bên cạnh gốc cây.", "Hold one palm over a finger to make a mushroom cap.", "Xòe bàn tay che trên một ngón tay để làm mũ nấm."),
  picture("butterfly", "con bướm", "The butterfly opens its wings.", "Bướm xòe cánh.", "Link your thumbs and flutter your fingers as wings.", "Móc hai ngón cái vào nhau rồi vẫy các ngón tay làm cánh bướm."),
  picture("bee", "con ong", "The bee visits a flower.", "Ong bay đến bông hoa.", "Make a quiet buzzing sound and let a finger land on a pretend flower.", "Cùng kêu vo ve thật khẽ rồi cho ngón tay đậu lên một bông hoa tưởng tượng."),
  picture("snail", "ốc sên", "The snail moves slowly.", "Ốc sên bò chậm.", "Trace the spiral on the snail’s shell.", "Lần theo đường xoắn trên vỏ ốc sên."),
  picture("spider", "con nhện", "The spider has eight legs.", "Nhện có tám chân.", "Walk your fingers like spider legs across the table.", "Cho các ngón tay bò trên bàn như chân nhện."),
  picture("ladybird", "bọ rùa", "The ladybird has black spots.", "Bọ rùa có những chấm đen.", "Find one black spot, then another. “Ladybug” is another name for this insect.", "Tìm một chấm đen rồi tìm thêm một chấm nữa. Trong tiếng Anh, bọ rùa còn gọi là “ladybug”."),
 ]},
 {id:'toys',name:{en:'Time for toys',vi:'Giờ chơi đồ chơi'},words:[
  picture("drum", "cái trống", "I tap the drum with my hands.", "Mình dùng tay vỗ trống.", "Tap a slow rhythm on your knees and let your child copy it.", "Vỗ một nhịp chậm lên đầu gối rồi mời bé vỗ theo."),
  picture("doll", "búp bê", "I rock my doll to sleep.", "Mình ru búp bê ngủ.", "Cradle a pretend doll and rock it gently.", "Giả vờ bế búp bê và đung đưa nhẹ nhàng."),
  picture("blocks", "những khối xếp hình", "I build a tower with blocks.", "Mình dùng các khối xếp hình để xây tháp.", "Stack your fists one above the other like toy blocks.", "Đặt hai nắm tay chồng lên nhau như những khối xếp hình."),
  picture("teddy-bear", "gấu bông", "I hug my teddy bear.", "Mình ôm chú gấu bông.", "Give an imaginary teddy bear a big hug.", "Giả vờ ôm thật chặt một chú gấu bông."),
  picture("robot", "rô-bốt", "My toy robot waves its hand.", "Rô-bốt đồ chơi của mình vẫy tay.", "Wave in short, jerky movements like the robot.", "Vẫy tay từng nhịp ngắn như rô-bốt."),
  picture("puzzle", "trò ghép hình", "This piece fits in the puzzle.", "Mảnh này vừa với chỗ trống trong tranh ghép.", "Turn an imaginary piece until it fits.", "Giả vờ xoay một mảnh ghép đến khi vừa chỗ trống."),
  picture("crayon", "bút sáp màu", "I draw with a crayon.", "Mình vẽ bằng bút sáp màu.", "Draw a shape in the air and let your child copy it.", "Vẽ một hình trong không khí rồi mời bé vẽ theo."),
  picture("yo-yo", "con quay yo-yo", "The yo-yo rolls down its string.", "Chiếc yo-yo lăn xuống theo sợi dây.", "Move your hand down and up as if playing with a yo-yo.", "Đưa tay xuống rồi lên như khi chơi yo-yo."),
 ]},
];
export const pictureWords=pictureTopics.flatMap(topic=>topic.words);
export const extendedPictureIds=new Set(pictureWords.slice(littleWords.length).map(w=>w.id));
