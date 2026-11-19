// Original Atlas study units. IDs and scoring keys identify this published edition.
export const c1Units = [
  {
    id: "course-c1-consultation-v1",
    level: "C1",
    kind: "reading",
    title: ["Summarising a public consultation","Tóm tắt ý kiến tham vấn"],
    objective: ["Separate the organiser's proposal from respondents' views. Report reservations alongside support, and keep claims about respondents within the group that actually replied.","Tách đề xuất của ban tổ chức khỏi ý kiến người trả lời. Khi tóm tắt sự ủng hộ, giữ cả những băn khoăn đi kèm và xác định đúng nhóm đã phản hồi."],
    examples: ["Several respondents supported later opening subject to staffing cover.","That tells us about those respondents. The views of residents who did not reply remain unknown."],
    lexicon: [
      {"term":"reservation","kind":"word","en":"a concern that qualifies someone's support","vi":"điều còn băn khoăn","example":"She expressed reservations about the timetable."},
      {"term":"consultation","kind":"word","en":"a process for seeking views before a decision","vi":"quá trình tham vấn","example":"The consultation ends before the vote."},
      {"term":"in principle","kind":"expression","en":"as a general idea, with details still to be settled","vi":"về nguyên tắc","example":"We accept the change in principle."},
      {"term":"representative","kind":"word","en":"reflecting the wider group being described","vi":"có tính đại diện","example":"A voluntary sample may be unrepresentative even if it is large."},
      {"term":"raise a concern","kind":"collocation","en":"to draw attention to a possible problem","vi":"nêu mối lo","example":"Residents raised a concern about night buses."},
      {"term":"subject to","kind":"expression","en":"dependent on a condition or approval","vi":"tùy thuộc vào, với điều kiện","example":"Access is subject to staff availability."}
    ],
    items: [
      {"prompt":"A council invited comments by email. Of the forty replies, thirty welcomed a later library closing time; ten of those thirty wanted an earlier closing time on Sundays. The report says, “Three quarters of local residents endorsed the proposed timetable in full.” Which edit fixes both overstatements?","options":["Three quarters of respondents welcomed later closing, some with reservations about Sundays.","Three quarters of all library users favoured every proposed hour except Sunday.","Thirty residents opposed Sunday opening and supported the rest of the timetable."],"keys":["Three quarters of respondents welcomed later closing, some with reservations about Sundays."],"why":["The denominator is replies. Welcoming later closing also allows a reservation about one day.","Mẫu số là số người phản hồi. Ủng hộ đóng cửa muộn vẫn có thể kèm băn khoăn về ngày Chủ nhật."]},
      {"prompt":"Choose contingent or conclusive. Support is ___ on there being a return bus after the final session.","keys":["contingent"],"why":["Contingent on links support to a condition that must be met.","Contingent on diễn đạt sự phụ thuộc vào điều kiện phải có chuyến xe về."]},
      {"prompt":"“Traders were asked for views. The summary describes the revised fee as manageable, quoting one stallholder. A second stallholder calls the fee a barrier, but appears only in an appendix.” What is the most precise criticism?","options":["The summary invented the first stallholder's words.","All the traders considered the fee unaffordable.","The prominence given to the first quotation understates the range of views."],"keys":["The prominence given to the first quotation understates the range of views."],"why":["Both views exist. The criticism concerns their relative prominence, without alleging fabricated words or unanimity.","Cả hai ý kiến đều có thật. Vấn đề là mức độ nổi bật khác nhau, chưa đủ căn cứ nói trích dẫn bị bịa hay mọi người đều phản đối."]},
      {"prompt":"Complete with respondents or responses. “Three ___ each sent two comments.” Use the noun for the people.","keys":["respondents"],"why":["Respondents are people who reply. Responses are the replies themselves.","Respondents là những người phản hồi; responses là câu trả lời."]},
      {"prompt":"Draft: “Residents rejected the pilot.” Source: “Of six residents interviewed, four doubted that a one-week pilot would reveal seasonal use.” Which summary preserves the object of their doubt?","options":["Four residents rejected any trial of the service.","Four interviewees predicted no seasonal use.","Four interviewees questioned what a one-week trial could show."],"keys":["Four interviewees questioned what a one-week trial could show."],"why":["They question the duration's adequacy for a specific purpose. The service and the idea of a trial remain open.","Họ nghi ngờ một tuần có đủ để thấy tính mùa vụ hay không, chứ chưa bác bỏ dịch vụ hoặc mọi thử nghiệm."]}
    ],
    prerequisite: "course-b2-minutes-v1"
  },
  {
    id: "course-c1-research-v1",
    level: "C1",
    kind: "reading",
    title: ["Interpreting a cautious research claim","Đọc nhận định nghiên cứu thận trọng"],
    objective: ["Ask what was measured, who selected the conditions and how far the conclusion extends. An association can support an explanation while leaving competing explanations open.","Xác định đại lượng được đo, ai chọn điều kiện và kết luận áp dụng đến đâu. Một mối liên hệ có thể ủng hộ một cách giải thích dù vẫn còn những cách giải thích khác."],
    examples: ["Readers who chose the quieter room recalled more words. They may also have been less tired.","The finding is consistent with a quiet-room benefit; the room choice leaves an alternative explanation."],
    lexicon: [
      {"term":"association","kind":"word","en":"a pattern in which two things vary together","vi":"mối liên hệ","example":"The survey found an association between distance and attendance."},
      {"term":"selection bias","kind":"collocation","en":"distortion caused by how participants enter a sample or group","vi":"sai lệch do cách chọn mẫu hoặc phân nhóm","example":"Voluntary sign-up can introduce selection bias."},
      {"term":"account for","kind":"phrasal-verb","en":"to explain an observation or difference","vi":"giải thích được","example":"The earlier start may account for the smaller audience."},
      {"term":"tentative","kind":"word","en":"held provisionally while evidence is limited","vi":"tạm thời, chưa chắc chắn","example":"The authors offer a tentative explanation."},
      {"term":"attribute","kind":"word","en":"to identify something as the cause or source","vi":"quy cho, cho là do","example":"They attribute the delay to a missed connection."},
      {"term":"consistent with","kind":"expression","en":"compatible with, without proving","vi":"phù hợp với, chưa đủ để chứng minh","example":"The pattern is consistent with several explanations."}
    ],
    items: [
      {"prompt":"Students chose either a paper diary or an app. App users then submitted homework more often. Before choosing, these students had also submitted more often. Which conclusion gives the prior record its due?","options":["The earlier difference could account for some of the later gap.","The prior record proves the app made no difference.","The higher submission rate can be attributed entirely to the app."],"keys":["The earlier difference could account for some of the later gap."],"why":["An existing difference weakens a purely causal reading of the later comparison, but cannot establish zero effect.","Sự khác biệt có từ trước làm yếu lập luận quy toàn bộ kết quả cho ứng dụng, nhưng cũng chưa chứng minh ứng dụng không có tác dụng."]},
      {"prompt":"Complete the collocation with to or from. The report attributes the change ___ improved access.","keys":["to"],"why":["Attribute an outcome to a cause names the proposed source of that outcome.","Cấu trúc attribute X to Y nghĩa là cho rằng X là do Y."]},
      {"prompt":"“Visitors reported a greater sense of safety after the signs were installed. Incidents were not counted.” Which headline stays within the measured outcome?","options":["Visitors felt safer after the signs appeared.","Signs cut the number of incidents.","Visitors became better at avoiding every hazard."],"keys":["Visitors felt safer after the signs appeared."],"why":["The measure concerns a reported feeling. Neither an incident count nor an avoidance skill was measured.","Nghiên cứu đo cảm giác tự báo cáo, không đo số vụ việc hay kỹ năng tránh nguy hiểm."]},
      {"prompt":"A writer changes “can contribute to” into “is sufficient to ensure”. What has changed?","options":["A guarantee has become a cautious association.","Only the register has changed.","One possible contributing factor has become a guarantee."],"keys":["One possible contributing factor has become a guarantee."],"why":["A contribution can work alongside other factors. Sufficiency claims the factor alone can secure the outcome.","Một yếu tố đóng góp có thể cần các yếu tố khác. Sufficient khẳng định chỉ riêng nó đã đủ."]},
      {"prompt":"Choose exclude or establish. “Two explanations fit these results; the study cannot ___ either one on the available evidence.” The writer means neither has been ruled out.","keys":["exclude"],"why":["Exclude means rule out. Establish would concern proving an explanation instead.","Exclude nghĩa là loại trừ. Establish lại nói đến việc xác lập một cách giải thích."]}
    ],
    prerequisite: "course-b2-inferences-v1"
  },
  {
    id: "course-c1-diplomacy-v1",
    level: "C1",
    kind: "communication",
    title: ["Disagreeing without giving consent","Bày tỏ bất đồng mà vẫn giữ thiện chí"],
    objective: ["Separate an acknowledgement of someone's reason from agreement with their proposal. Mark your own position and any condition for reconsidering it.","Phân biệt việc ghi nhận lý do của người khác với việc đồng ý đề xuất. Nêu rõ lập trường của mình và điều kiện để cân nhắc lại."],
    examples: ["I see why speed matters. I would still prefer a short review before signing.","If the missing figures arrive today, I'm happy to revisit the date."],
    lexicon: [
      {"term":"acknowledge","kind":"word","en":"to recognise a point or fact openly","vi":"ghi nhận, thừa nhận","example":"We acknowledge the pressure on the team."},
      {"term":"reconsider","kind":"word","en":"to think about a decision again","vi":"xem xét lại","example":"They will reconsider once the trial is complete."},
      {"term":"common ground","kind":"collocation","en":"a position or interest people share","vi":"điểm chung","example":"Both sides found common ground on training."},
      {"term":"hold off","kind":"phrasal-verb","en":"to delay acting","vi":"tạm hoãn","example":"Hold off on printing until the figures are final."},
      {"term":"meet halfway","kind":"idiom","en":"to reach a compromise through concessions by both sides","vi":"mỗi bên nhượng bộ một phần","example":"One side offered a shorter term to meet the other halfway."},
      {"term":"qualified support","kind":"collocation","en":"support with stated limits","vi":"sự ủng hộ có điều kiện","example":"The letter expressed qualified support for extending the trial."}
    ],
    items: [
      {"prompt":"A colleague wants to promise delivery on Friday. You accept the need for a prompt reply but do not know the delivery date. Which response preserves both positions?","options":["I appreciate the urgency, so Friday is confirmed.","We should say nothing until the delivery has taken place.","Let's reply today and say we'll confirm the date after the stock check."],"keys":["Let's reply today and say we'll confirm the date after the stock check."],"why":["The first response accepts prompt communication while withholding a commitment the stock check must support.","Câu đầu đồng ý phản hồi sớm nhưng chưa cam kết ngày giao khi chưa kiểm tra tồn kho."]},
      {"prompt":"“I'm comfortable with the direction of travel; signing off the figures is another matter.” What is being withheld?","options":["Approval of the figures","Support for the general approach","Permission to discuss either point"],"keys":["Approval of the figures"],"why":["The speaker accepts the broad approach and draws a boundary at numerical approval.","Người nói đồng tình hướng đi chung nhưng chưa phê duyệt số liệu."]},
      {"prompt":"Complete with assent or assess. “I can summarise their reasons without giving my ___ to the proposal.”","keys":["assent"],"why":["Give assent to means formally agree. Assess is a verb and cannot fill this noun slot.","Give assent to nghĩa là chấp thuận. Assess là động từ nên không phù hợp vị trí danh từ."]},
      {"prompt":"Your reply says “I was wondering whether the deadline is flexible.” Why might the recipient reasonably ask a follow-up?","options":["It formally cancels the deadline.","It sounds like an indirect request but gives no proposed alternative date.","It guarantees the writer will miss the deadline."],"keys":["It sounds like an indirect request but gives no proposed alternative date."],"why":["The phrasing invites flexibility without specifying a new date or announcing a cancellation.","Cách hỏi mở đường xin điều chỉnh nhưng chưa đưa ra ngày thay thế."]},
      {"prompt":"Use the base verb following would rather. “We'd rather ___ the launch than announce a date we can't keep.” Use delay.","keys":["delay"],"why":["With the same subject, would rather is followed by the bare infinitive.","Khi hai hành động cùng chủ ngữ, sau would rather dùng động từ nguyên mẫu không to."]}
    ],
    prerequisite: "course-b2-minutes-v1"
  },
  {
    id: "course-c1-scope-v1",
    level: "C1",
    kind: "reading",
    title: ["Who does the exception cover?","Ngoại lệ áp dụng cho ai?"],
    objective: ["Track the people, action and time covered by a qualification. A permission for one group does not automatically remove a general requirement for everyone.","Xác định ngoại lệ giới hạn nhóm người, hành động và thời điểm nào. Cho phép một nhóm không có nghĩa là bỏ yêu cầu chung cho tất cả."],
    examples: ["All visitors sign in. Badge holders may use the side entrance after signing in.","The badge changes the entrance available, while the sign-in rule still applies."],
    lexicon: [
      {"term":"exemption","kind":"word","en":"release from a requirement that normally applies","vi":"sự miễn trừ","example":"The exemption covers evening sessions only."},
      {"term":"eligible","kind":"word","en":"meeting the conditions to qualify","vi":"đủ điều kiện","example":"Part-time staff are eligible for this course."},
      {"term":"waive","kind":"word","en":"to decide not to enforce a charge or requirement","vi":"miễn, không áp dụng","example":"The club waived the first month's fee."},
      {"term":"prior notice","kind":"collocation","en":"information given before something happens","vi":"thông báo trước","example":"Even members must give prior notice."},
      {"term":"at the discretion of","kind":"expression","en":"as decided by a particular person or body","vi":"tùy quyết định của","example":"Late entry is at the discretion of the organiser."},
      {"term":"fall within","kind":"expression","en":"to be included within a defined group or limit","vi":"nằm trong phạm vi","example":"The repair falls within the maintenance agreement."}
    ],
    items: [
      {"prompt":"Policy: “Bookings are for named groups. A registered leader may replace one member without a new booking, provided the total stays the same. All attendees must still sign in.” A leader replaces one person. Which duty survives?","options":["A new booking must always be made.","Everyone attending must sign in.","Only the replacement must sign in."],"keys":["Everyone attending must sign in."],"why":["The exception concerns booking again. Still preserves sign-in for all attendees.","Ngoại lệ chỉ miễn đặt lại chỗ. Still giữ yêu cầu ký tên với tất cả người đến."]},
      {"prompt":"“The fee may be waived.” Choose entitlement or possibility. On its own, this grants a ___ rather than an automatic right.","keys":["possibility"],"why":["May leaves room for a decision. An unconditional entitlement would give the applicant a right.","May cho thấy còn tùy quyết định. Entitlement là quyền đương nhiên theo điều kiện đã nêu."]},
      {"prompt":"An instruction reads “Only applications received by noon will be reviewed today.” An application arrived at eleven. What follows from that sentence alone?","options":["It must be reviewed today.","It must be approved today.","It meets the time condition, but review today is not guaranteed."],"keys":["It meets the time condition, but review today is not guaranteed."],"why":["Only makes receipt by noon necessary for review today. It does not say every timely application will be reviewed.","Only biến việc nhận trước trưa thành điều kiện cần. Câu không cam kết xử lý mọi hồ sơ đến kịp."]},
      {"prompt":"“The duty manager can extend access by one hour. Staff must record each extension.” Which rewrite preserves both rules?","options":["Staff may add any length of time if they keep a log.","Managers must grant an hour whenever staff request it.","A manager may grant one extra hour, and staff must log it."],"keys":["A manager may grant one extra hour, and staff must log it."],"why":["The original separates the manager's discretion on access from the staff's obligation to record it.","Văn bản phân biệt quyền quyết định gia hạn của quản lý và nghĩa vụ ghi lại của nhân viên."]},
      {"prompt":"Use exempt as a past participle. “Staff are ___ from the fee, but must still reserve a seat.”","keys":["exempted","exempt"],"why":["Exempted is the requested participle. Exempt is also idiomatic here as an adjective, with the same effect.","Exempted là quá khứ phân từ. Tính từ exempt cũng dùng tự nhiên trong câu này và giữ nguyên nghĩa."]}
    ],
    prerequisite: "course-b2-refunds-v1"
  },
  {
    id: "course-c1-editing-v1",
    level: "C1",
    kind: "grammar",
    title: ["Editing for clear reference","Biên tập để câu rõ chủ thể"],
    objective: ["In an opening participle clause, the implied actor normally matches the subject of the main clause. Name the actor explicitly when another interpretation is possible.","Trong cụm phân từ đầu câu, người thực hiện thường trùng với chủ ngữ mệnh đề chính. Hãy nêu rõ chủ thể khi câu có thể gây hiểu nhầm."],
    examples: ["After comparing the quotes, the buyer chose the lower bid.","Once the quotes had been compared, the lower bid was selected."],
    lexicon: [
      {"term":"modifier","kind":"word","en":"a word or phrase that adds detail to another expression","vi":"thành phần bổ nghĩa","example":"Moving the modifier changed which event seemed recent."},
      {"term":"unambiguous","kind":"word","en":"having only one clear interpretation","vi":"rõ nghĩa, không nhập nhằng","example":"The editor asked for an unambiguous reference."},
      {"term":"refer back","kind":"phrasal-verb","en":"to point to something mentioned earlier","vi":"chỉ về nội dung đã nêu trước","example":"Here the pronoun refers back to the proposal."},
      {"term":"draft","kind":"word","en":"a version of a text that may still change","vi":"bản nháp","example":"Two different people appear in the first draft."},
      {"term":"misleading impression","kind":"collocation","en":"an understanding that the wording encourages but the facts do not support","vi":"ấn tượng dễ dẫn tới hiểu lầm","example":"The order of the clauses creates a misleading impression."},
      {"term":"clarify","kind":"word","en":"to make the intended meaning easier to understand","vi":"làm rõ","example":"Please clarify who approved the request."}
    ],
    items: [
      {"prompt":"Draft: “Having checked the room twice, the missing folder remained a mystery.” The clerk did the checking. Which edit makes this clear?","options":["Having checked the room twice, the folder was still missing.","The mystery checked the room twice for the clerk.","Having checked the room twice, the clerk still could not explain the missing folder."],"keys":["Having checked the room twice, the clerk still could not explain the missing folder."],"why":["In the first revision, the clerk is the grammatical subject and the understood checker.","Ở câu sửa đầu, the clerk vừa là chủ ngữ vừa là người đã kiểm tra."]},
      {"prompt":"Choose having or being. “___ completed the first interview, the reporter turned to the second guest.”","keys":["Having"],"why":["Having completed presents the reporter's earlier action as finished before the next one.","Having completed diễn đạt hành động người phỏng vấn đã làm xong trước khi chuyển sang khách thứ hai."]},
      {"prompt":"“When Mai thanked Linh for her note, she smiled.” You know Linh smiled. Which edit removes the ambiguity without adding a motive?","options":["When Mai thanked Linh, she smiled because she was relieved.","When Mai thanked Linh, Mai smiled at the note.","When Mai thanked Linh for the note, Linh smiled."],"keys":["When Mai thanked Linh for the note, Linh smiled."],"why":["Repeating Linh fixes the referent. A reason such as relief is extra information.","Lặp lại tên Linh làm rõ người mỉm cười. Lý do nhẹ nhõm không có trong dữ kiện."]},
      {"prompt":"The report says “We nearly interviewed all the residents.” The intended fact is that interviews happened with all but two residents. Which replacement is precise?","options":["We came close to interviewing the residents but did not start.","We interviewed every resident nearly twice.","We interviewed nearly all the residents."],"keys":["We interviewed nearly all the residents."],"why":["Putting nearly beside all limits the proportion reached, rather than the occurrence of interviewing.","Đặt nearly cạnh all để giới hạn tỉ lệ người đã được phỏng vấn thay vì gây hiểu rằng suýt nữa mới phỏng vấn."]},
      {"prompt":"Use compare in the past participle. “When ___ with the signed copy, the draft showed two omissions.”","keys":["compared"],"why":["The draft receives the comparison, so the reduced passive clause uses compared.","Bản nháp là đối tượng được so sánh, nên mệnh đề bị động rút gọn dùng compared."]}
    ],
    prerequisite: "course-b2-updates-v1"
  },
  {
    id: "course-c1-critique-v1",
    level: "C1",
    kind: "communication",
    title: ["Making criticism actionable","Góp ý cụ thể và có căn cứ"],
    objective: ["Separate an observation, its effect and a proposed revision. Match the strength of the judgment to evidence available to the reader.","Tách quan sát, hệ quả và đề nghị sửa. Mức độ phê bình cần tương xứng với bằng chứng mà người đọc có thể kiểm tra."],
    examples: ["The chart leaves out the units. Adding them would let readers compare the two scales.","This suggests a labelling problem without claiming the figures are wrong."],
    lexicon: [
      {"term":"substantiate","kind":"word","en":"to support a claim with evidence","vi":"chứng minh bằng căn cứ","example":"The author added figures to substantiate the claim."},
      {"term":"specify","kind":"word","en":"to state something precisely","vi":"nêu rõ","example":"Please specify whether the total includes tax."},
      {"term":"constructive feedback","kind":"collocation","en":"comments that help someone improve their work","vi":"góp ý mang tính xây dựng","example":"Constructive feedback identifies a change the writer can make."},
      {"term":"overlook","kind":"word","en":"to fail to notice or consider","vi":"bỏ sót","example":"The draft overlooks readers without a smartphone."},
      {"term":"work through","kind":"phrasal-verb","en":"to deal with something carefully in stages","vi":"xem xét từng bước","example":"Let's work through the example together."},
      {"term":"room for improvement","kind":"expression","en":"scope to make something better","vi":"điểm còn có thể cải thiện","example":"There is room for improvement in the instructions."}
    ],
    items: [
      {"prompt":"A grant application claims the class “reached more readers”. It reports 90 visits but does not say how many different people attended or what the earlier number was. Which feedback addresses the actual evidence gap?","options":["Replace the visits with a larger number.","Remove the dates because numbers speak for themselves.","Report distinct attendees and the earlier comparison figure."],"keys":["Report distinct attendees and the earlier comparison figure."],"why":["Visits can include repeat attendance. More also requires a comparison, so both missing details matter.","Một người có thể đến nhiều lần. Từ more còn đòi hỏi mốc so sánh, nên cần cả hai thông tin."]},
      {"prompt":"“The conclusion is unsupported by the table.” Which reply directly addresses that criticism?","options":["We can make the table's heading bolder.","We can state the same conclusion more confidently.","We can add the omitted measurements or narrow the conclusion to what the table shows."],"keys":["We can add the omitted measurements or narrow the conclusion to what the table shows."],"why":["The issue is the match between evidence and claim. Typography or stronger wording cannot supply missing evidence.","Vấn đề là mức độ kết luận phù hợp với dữ liệu. Đổi kiểu chữ hay khẳng định mạnh hơn không bổ sung được căn cứ."]},
      {"prompt":"Choose imply or infer. The reviewer can ___ a possible preference from the order of examples, but the author has not stated one.","keys":["infer"],"why":["A reader infers a meaning from clues. Wording or a speaker can imply it.","Người đọc infer, tức là suy ra từ dấu hiệu. Người viết hoặc cách diễn đạt có thể imply, tức là ngụ ý."]},
      {"prompt":"A reader says the last paragraph is hard to follow because “this change” could refer to a fee increase or a new deadline. Which edit directly helps?","options":["Replace “this change” with the specific change intended.","Delete both dates without naming either change.","Move the phrase to the top of the page unchanged."],"keys":["Replace “this change” with the specific change intended."],"why":["The ambiguity concerns the reference. Naming its intended subject resolves it.","Sự mơ hồ nằm ở đối tượng được nhắc tới. Nêu đúng tên thay đổi sẽ giải quyết vấn đề."]},
      {"prompt":"Use evidence as a count or mass noun here. Complete with much or many: “The article gives a striking example but little detail on how ___ evidence supports the wider claim.”","keys":["much"],"why":["In this use evidence is a mass noun. Quantify it with much or count pieces of evidence.","Evidence dùng như danh từ không đếm được. Dùng much hoặc đếm từng piece of evidence."]}
    ],
    prerequisite: "course-b2-comparing-options-v1"
  }
];

