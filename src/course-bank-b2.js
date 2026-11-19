// Original Atlas study units. IDs and scoring keys identify this published edition.
export const b2Units = [
  {
    id: "course-b2-refunds-v1",
    level: "B2",
    kind: "reading",
    title: ["Reading a returns policy","Đọc chính sách đổi trả"],
    objective: ["Separate a general rule from an exception. Provided that sets a condition; even if says an outcome can still hold despite a particular fact.","Phân biệt quy định chung với ngoại lệ. Provided that nêu điều kiện; even if cho biết kết quả vẫn có thể xảy ra dù có một yếu tố nào đó."],
    examples: ["Members can join free provided that they register first.","The booking stays valid even if the date changes."],
    lexicon: [
      {"term":"refund","kind":"word","en":"money paid back to a customer","vi":"khoản hoàn tiền","example":"The refund reached my account on Monday."},
      {"term":"exchange","kind":"word","en":"a replacement item given for one returned","vi":"việc đổi lấy món khác","example":"She asked for an exchange in a smaller size."},
      {"term":"proof of purchase","kind":"collocation","en":"a record showing that you bought an item","vi":"bằng chứng mua hàng","example":"A digital receipt counts as proof of purchase."},
      {"term":"unused","kind":"word","en":"never used","vi":"chưa sử dụng","example":"The jacket must be unused."},
      {"term":"faulty","kind":"word","en":"not working as it should","vi":"bị lỗi","example":"The clock stopped because the battery cover was faulty."},
      {"term":"store credit","kind":"collocation","en":"a sum you may spend in the same shop","vi":"khoản tiền chỉ dùng để mua tại cửa hàng đó","example":"They offered store credit for the returned lamp."}
    ],
    items: [
      {"prompt":"Notice: “For a change of mind, return unused goods within ten days for store credit. Faulty goods may be returned within thirty days for a refund.” On day eight an unused lamp works perfectly. What does the notice offer?","options":["A refund because it is unused","Credit to spend in the shop","An automatic replacement and a refund"],"keys":["Credit to spend in the shop"],"why":["The reason is a change of mind. Being unused meets that rule; it does not turn the lamp into faulty goods.","Đèn vẫn hoạt động nên áp dụng quy định đổi ý. Hàng chưa dùng đủ điều kiện nhận tiền mua hàng tại cửa hàng."]},
      {"prompt":"“Show a receipt or the payment confirmation email. The card alone cannot be accepted.” A buyer has lost the receipt. Which evidence can still work?","options":["The bank card by itself","A photograph of a different purchase","The confirmation email"],"keys":["The confirmation email"],"why":["Or allows either named record. The next sentence explicitly rules out the card alone.","Or cho phép dùng một trong hai chứng từ. Câu sau loại trường hợp chỉ có thẻ."]},
      {"prompt":"Choose unless or even if. “Sale goods cannot be exchanged, ___ they have never been worn.” The ban still applies to unworn goods.","keys":["even if"],"why":["Even if leaves the ban in place; unless would create an exception for unworn goods.","Even if giữ nguyên lệnh cấm đổi; unless lại biến hàng chưa mặc thành ngoại lệ."]},
      {"prompt":"“Online orders must be posted back. We accept shop purchases at any branch.” What is missing before staff can give the correct return address?","options":["Why the customer likes the colour","Which branch is closest to the factory","How the item was bought"],"keys":["How the item was bought"],"why":["The purchase channel determines the return method.","Cần biết khách mua trực tuyến hay ở cửa hàng vì hai cách mua có thủ tục trả khác nhau."]},
      {"prompt":"Complete the passive using the past participle of refund. “Delivery charges will be ___ only if we sent the wrong size.”","keys":["refunded"],"why":["Will be needs the past participle. The following condition limits when the money is paid back.","Sau will be dùng quá khứ phân từ refunded. Chỉ giao sai cỡ mới được hoàn phí."]}
    ],
    prerequisite: "course-b1-repairs-v1"
  },
  {
    id: "course-b2-minutes-v1",
    level: "B2",
    kind: "grammar",
    title: ["Reporting a meeting accurately","Tường thuật cuộc họp chính xác"],
    objective: ["Match the reporting verb to the speaker's commitment. Suggest doing something proposes it. Agree to do something records a commitment by the person who agreed.","Chọn động từ tường thuật đúng mức độ cam kết. Suggest doing something là đề xuất. Agree to do something cho biết người đó đã đồng ý thực hiện."],
    examples: ["Mai suggested trying a smaller room. The chair agreed to check availability.","A suggestion alone does not mean the meeting adopted a decision."],
    lexicon: [
      {"term":"minutes","kind":"word","en":"the written record of a meeting","vi":"biên bản cuộc họp","example":"The minutes name the person responsible for each task."},
      {"term":"propose","kind":"word","en":"to put forward an idea for consideration","vi":"đề xuất","example":"They proposed a shorter trial."},
      {"term":"undertake","kind":"word","en":"to formally agree to do something","vi":"cam kết đảm nhiệm","example":"I undertake to send the figures tomorrow."},
      {"term":"follow up","kind":"phrasal-verb","en":"to take further action about something already raised","vi":"theo dõi và xử lý tiếp","example":"Please follow up with the supplier."},
      {"term":"reach an agreement","kind":"collocation","en":"to come to a shared decision","vi":"đạt thỏa thuận","example":"The two teams reached an agreement on costs."},
      {"term":"action item","kind":"collocation","en":"a specific task assigned after a discussion","vi":"việc cần thực hiện sau cuộc họp","example":"The only action item is to obtain a quote."}
    ],
    items: [
      {"prompt":"Linh said, “Why don't we ask the shops first?” No one answered. Which minute is accurate?","options":["Linh suggested consulting the shops.","Everyone agreed to consult the shops.","Linh confirmed the shops had been consulted."],"keys":["Linh suggested consulting the shops."],"why":["The question proposes an action. Silence supplies no decision or evidence of completion.","Câu hỏi đưa ra đề xuất. Không có lời đáp nên chưa thể ghi là cả nhóm đã đồng ý hay đã làm xong."]},
      {"prompt":"Use contact in the form that fits. They suggested ___ the caretaker before setting a date.","keys":["contacting"],"why":["With this construction suggest is followed by an -ing form.","Trong cấu trúc này, suggest đi với động từ dạng -ing."]},
      {"prompt":"“I'll check the budget,” said Hoa. “Fine,” replied Nam. Whose name should go beside the budget check?","options":["Nam's","The supplier's","Hoa's"],"keys":["Hoa's"],"why":["Hoa volunteered to act. Nam's reply accepts the offer without taking over the task.","Hoa nhận việc. Nam đồng ý với đề nghị chứ không nhận làm thay."]},
      {"prompt":"Write the infinitive including to. Use send. The coordinator agreed ___ a written reply.","keys":["to send"],"why":["Agree takes a to-infinitive when someone commits to an action.","Khi cam kết làm gì, dùng agree + to + động từ."]},
      {"prompt":"The chair said, “We might need two vans.” Which report preserves the uncertainty?","options":["The chair ordered two vans.","The chair said a second van might be needed.","The chair ruled out a second van."],"keys":["The chair said a second van might be needed."],"why":["Might presents a possibility without an order or a final decision.","Might chỉ khả năng, chưa phải mệnh lệnh hay quyết định cuối cùng."]}
    ],
    prerequisite: "course-b1-enquiries-v1"
  },
  {
    id: "course-b2-updates-v1",
    level: "B2",
    kind: "grammar",
    title: ["Writing a progress update","Viết bản cập nhật tiến độ"],
    objective: ["Use a passive when the result matters more than the person doing the work. Has been completed presents a result; is being completed describes work in progress.","Dùng bị động khi kết quả quan trọng hơn người thực hiện. Has been completed diễn đạt kết quả đã có; is being completed nói công việc đang diễn ra."],
    examples: ["The entrance has been repaired. The signs are being painted.","The contractor will inspect the last room tomorrow."],
    lexicon: [
      {"term":"inspection","kind":"word","en":"a careful check of condition or quality","vi":"đợt kiểm tra","example":"The lift is closed for inspection."},
      {"term":"carry out","kind":"phrasal-verb","en":"to perform a task or check","vi":"tiến hành, thực hiện","example":"They will carry out the inspection on Tuesday."},
      {"term":"outstanding","kind":"word","en":"still needing to be done or settled","vi":"còn tồn đọng","example":"One small repair is outstanding."},
      {"term":"on schedule","kind":"expression","en":"at the time planned","vi":"đúng tiến độ","example":"The work is on schedule."},
      {"term":"under way","kind":"expression","en":"already started and continuing","vi":"đang diễn ra","example":"Work on the entrance is under way."},
      {"term":"completion","kind":"word","en":"the point at which work is finished","vi":"sự hoàn tất","example":"Payment is due on completion."}
    ],
    items: [
      {"prompt":"Use the present perfect passive of replace. Both broken windows ___, so the room is warm again.","keys":["have been replaced"],"why":["Both windows is plural, and the finished replacement explains the present result.","Chủ ngữ số nhiều đi với have been replaced. Công việc đã hoàn tất nên phòng ấm trở lại."]},
      {"prompt":"“The new signs are being fitted. The old ones have been removed.” Which job is finished?","options":["Fitting every new sign","Checking both sets of signs","Removing the old signs"],"keys":["Removing the old signs"],"why":["Have been removed reports a completed change. Are being fitted refers to work still under way.","Have been removed diễn đạt việc đã xong. Are being fitted là việc đang tiến hành."]},
      {"prompt":"Use check in the passive after will. Before reopening, all entrances will ___ by the manager.","keys":["be checked"],"why":["After will, a passive uses be plus the past participle checked.","Bị động sau will có dạng be + quá khứ phân từ."]},
      {"prompt":"“Most rooms are ready. One inspection remains outstanding.” What should a careful update say?","options":["Every room has passed inspection.","An inspection still needs to take place.","The inspection received an excellent grade."],"keys":["An inspection still needs to take place."],"why":["Outstanding beside remains means unfinished here. It is not the meaning excellent.","Trong remains outstanding, từ này nghĩa là còn tồn đọng, không phải xuất sắc."]},
      {"prompt":"The reader asks who approved a last-minute change. Which update answers that question?","options":["The change was approved at noon.","There was a change at noon.","The site manager approved the change at noon."],"keys":["The site manager approved the change at noon."],"why":["Naming the site manager supplies the requested agent. The time alone cannot do that.","Câu chủ động nêu rõ người phê duyệt. Chỉ có thời điểm thì chưa đủ."]}
    ],
    prerequisite: "course-b1-staying-in-touch-v1"
  },
  {
    id: "course-b2-missed-connections-v1",
    level: "B2",
    kind: "grammar",
    title: ["Explaining a missed connection","Giải thích việc lỡ chuyến"],
    objective: ["Use if + past perfect and would have + past participle to imagine a different past. Keep the real outcome separate from the imagined alternative.","Dùng if + quá khứ hoàn thành và would have + quá khứ phân từ để hình dung điều khác với quá khứ. Phân biệt kết quả thật với tình huống giả định."],
    examples: ["If the gates had stayed open, we would have caught the ferry.","In fact the gates closed and we missed it."],
    lexicon: [
      {"term":"connection","kind":"word","en":"a later service you change onto during a journey","vi":"chuyến nối tiếp","example":"A delay made us miss our connection."},
      {"term":"board","kind":"word","en":"to get onto a bus, ship, train or plane","vi":"lên xe, tàu hoặc máy bay","example":"We board the ferry at noon."},
      {"term":"delay","kind":"word","en":"time lost when something happens later than planned","vi":"sự chậm trễ","example":"The delay affected the last train."},
      {"term":"set off","kind":"phrasal-verb","en":"to start a journey","vi":"khởi hành","example":"We set off before sunrise."},
      {"term":"make up time","kind":"idiom","en":"to recover time lost through an earlier delay","vi":"bù lại thời gian bị chậm","example":"The bus made up time on the empty road."},
      {"term":"alternative","kind":"word","en":"another possible choice","vi":"phương án khác","example":"There is an alternative route through town."}
    ],
    items: [
      {"prompt":"Use the past perfect of leave. If we ___ earlier yesterday, we would have caught the coach.","keys":["had left"],"why":["The if-clause imagines an earlier departure that did not happen.","Mệnh đề if giả định một lúc khởi hành sớm hơn nhưng điều đó đã không xảy ra."]},
      {"prompt":"“If I'd checked the platform, I wouldn't have gone to the wrong one.” What actually happened?","options":["The platform was changed after a check.","The speaker found the right platform immediately.","The speaker went to the wrong platform."],"keys":["The speaker went to the wrong platform."],"why":["The past conditional imagines avoiding a mistake that actually occurred.","Câu điều kiện giả định tránh được lỗi đã xảy ra trong thực tế."]},
      {"prompt":"Use the past participle of catch. We would have ___ the bus if the crossing had been open.","keys":["caught"],"why":["Would have takes a past participle, and the participle of catch is caught.","Would have đi với quá khứ phân từ; catch có dạng caught."]},
      {"prompt":"You know the flight was delayed. You are unsure whether an earlier taxi would have helped. Which wording fits?","options":["An earlier taxi might have helped.","An earlier taxi definitely would have solved it.","The flight had no delay."],"keys":["An earlier taxi might have helped."],"why":["Might have leaves the past alternative uncertain. Definitely makes a stronger claim than the facts allow.","Might have giữ lại sự không chắc chắn. Definitely khẳng định mạnh hơn thông tin cho phép."]},
      {"prompt":"“We set off late but made up time on the motorway.” What can you safely conclude?","options":["The journey certainly ended early.","The driver changed the departure time retroactively.","Some time lost earlier was recovered."],"keys":["Some time lost earlier was recovered."],"why":["Make up time describes recovering time. It does not establish the final arrival time.","Make up time chỉ việc bù thời gian. Chưa đủ thông tin để kết luận giờ đến cuối cùng."]}
    ],
    prerequisite: "course-b1-repairs-v1"
  },
  {
    id: "course-b2-comparing-options-v1",
    level: "B2",
    kind: "reading",
    title: ["Comparing two proposals","So sánh hai đề xuất"],
    objective: ["Compare options against the same requirement. Whereas contrasts two facts; although marks a concession within one argument.","So sánh các phương án theo cùng một yêu cầu. Whereas đối chiếu hai thông tin; although nêu điều được thừa nhận trong một lập luận."],
    examples: ["The hall is cheap, whereas the studio includes equipment.","Although the studio costs more, it saves a separate equipment hire."],
    lexicon: [
      {"term":"trade-off","kind":"word","en":"a gain that comes at the cost of something else","vi":"sự đánh đổi","example":"There is a trade-off between space and price."},
      {"term":"upfront","kind":"word","en":"paid or required at the beginning","vi":"phải trả hoặc chuẩn bị từ đầu","example":"The upfront fee covers the first week."},
      {"term":"ongoing","kind":"word","en":"continuing over time","vi":"tiếp diễn, thường xuyên","example":"The group must budget for ongoing costs."},
      {"term":"take into account","kind":"expression","en":"to consider when deciding","vi":"tính đến","example":"Take travel time into account before choosing."},
      {"term":"capacity","kind":"word","en":"the number a place can hold","vi":"sức chứa","example":"The room has a capacity of forty."},
      {"term":"rule out","kind":"phrasal-verb","en":"to remove an option from consideration","vi":"loại trừ","example":"The lack of a lift rules out the upstairs room."}
    ],
    items: [
      {"prompt":"Room A holds 20, includes chairs, and is free. Room B holds 40 but charges a fee. Thirty people have confirmed. Which fact rules out A?","options":["The chairs provided","Its capacity","The absence of a fee"],"keys":["Its capacity"],"why":["Even a free room cannot meet a fixed requirement for thirty seats if it holds twenty.","Dù miễn phí, phòng chỉ chứa 20 người vẫn không đáp ứng yêu cầu 30 chỗ."]},
      {"prompt":"Choose despite or although. ___ its higher price, the hall remains popular.","keys":["Despite"],"why":["Despite takes a noun phrase such as its higher price. Although would require a clause.","Despite đi với cụm danh từ its higher price. Although cần một mệnh đề."]},
      {"prompt":"“Rent is lower at the warehouse, but heating is extra. The hall includes heating.” What information is needed to compare winter costs?","options":["The warehouse heating charge","The hall's wall colour","How long the warehouse has existed"],"keys":["The warehouse heating charge"],"why":["The advertised rents cover different things. The extra charge must be included.","Hai mức thuê bao gồm các khoản khác nhau. Cần cộng thêm phí sưởi ở nhà kho."]},
      {"prompt":"Which sentence concedes a drawback while recommending B?","options":["Although B is farther away, its lift makes it suitable for our group.","B is closer and has no lift.","Both sites have lifts, so distance never matters."],"keys":["Although B is farther away, its lift makes it suitable for our group."],"why":["Although signals the drawback. The main clause gives the deciding advantage for this group.","Although nêu nhược điểm. Mệnh đề chính đưa ra ưu điểm quyết định đối với nhóm này."]},
      {"prompt":"Complete with account or amount. The decision should take evening travel into ___.","keys":["account"],"why":["Take something into account means consider it as part of the decision.","Take something into account là tính một yếu tố vào quá trình ra quyết định."]}
    ],
    prerequisite: "course-b1-recommendations-v1"
  },
  {
    id: "course-b2-inferences-v1",
    level: "B2",
    kind: "grammar",
    title: ["Reasoning from incomplete information","Suy luận khi chưa đủ thông tin"],
    objective: ["For a past possibility use might have + past participle. Must have expresses a strong deduction. Distinguish an observed fact from an explanation you infer.","Dùng might have + quá khứ phân từ để nêu khả năng trong quá khứ. Must have thể hiện suy luận chắc chắn hơn. Phân biệt điều quan sát được với lời giải thích suy ra."],
    examples: ["The lights were on. Someone might have stayed late.","I saw the receipt dated today, so the payment can't have been made yesterday if that date is correct."],
    lexicon: [
      {"term":"clue","kind":"word","en":"a detail that helps explain something","vi":"manh mối","example":"A wet coat was the first clue."},
      {"term":"assume","kind":"word","en":"to take something as true without checking","vi":"cho là, giả định","example":"Do not assume that a closed door means an empty room."},
      {"term":"plausible","kind":"word","en":"reasonable enough to be possible","vi":"có lý, có thể xảy ra","example":"A flat battery is a plausible explanation."},
      {"term":"confirm","kind":"word","en":"to establish that something is true","vi":"xác nhận","example":"The receipt confirms the payment."},
      {"term":"turn out","kind":"phrasal-verb","en":"to become known in the end","vi":"hóa ra","example":"The missing box turned out to be in the office."},
      {"term":"jump to conclusions","kind":"idiom","en":"to decide too quickly from too little evidence","vi":"vội kết luận","example":"Let's find the key before we jump to conclusions."}
    ],
    items: [
      {"prompt":"You find a meeting room empty at noon. The group may have cancelled or moved. Which report respects both possibilities?","options":["The meeting might have moved.","The group must have cancelled.","The room was never reserved."],"keys":["The meeting might have moved."],"why":["The first report leaves other explanations open. The other reports add unsupported certainty.","Câu đầu vẫn cho phép có cách giải thích khác. Hai câu còn lại khẳng định điều chưa có căn cứ."]},
      {"prompt":"Use the past participle of forget. He might have ___ to set the alarm.","keys":["forgotten"],"why":["Might have is followed by a past participle, here forgotten.","Sau might have dùng quá khứ phân từ forgotten."]},
      {"prompt":"“I saw Kim sign the paper, but I didn't see where she put it.” Which claim is an observation?","options":["Kim signed the paper.","Kim filed the paper in a drawer.","Kim lost the paper afterwards."],"keys":["Kim signed the paper."],"why":["The signing was seen directly. The location afterwards was not observed.","Việc ký được nhìn thấy trực tiếp. Vị trí tờ giấy sau đó thì chưa biết."]},
      {"prompt":"Choose can't or must. The shop opened at nine. Its first customer entered at nine sharp. Someone inside at eight ___ have been that first customer entering at nine.","keys":["can't"],"why":["The two entry times are incompatible. Can't have rules out that identification of the event.","Hai thời điểm vào cửa khác nhau. Can't have loại trừ việc xem đó là cùng một lần vào cửa."]},
      {"prompt":"“The parcel turned out to be at the other branch.” What does turned out add?","options":["This is what was eventually discovered.","The parcel was returned to its sender.","The branch deliberately rejected it."],"keys":["This is what was eventually discovered."],"why":["Turned out marks the eventual discovery, without implying a return or refusal.","Turned out báo kết quả được phát hiện sau đó, không có nghĩa là trả lại hay từ chối."]}
    ],
    prerequisite: "course-b2-missed-connections-v1"
  }
];

