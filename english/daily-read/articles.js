/**
 * Daily Read — Articles Data
 * Template-based article data. Each article has a topic that maps to a day of the week.
 * To add new articles: push new objects to the ARTICLES array following the pattern below.
 *
 * Day/Topic rotation:
 *   Monday: Science | Tuesday: History | Wednesday: Technology
 *   Thursday: Nature | Friday: Culture | Saturday: Health | Sunday: World
 */

var ARTICLES = [
    // ── Monday: Science ──
    {
        id: 'sci-001',
        topic: 'Science',
        day: 'Monday',
        title: 'The Surprising Science of Sleep',
        body: [
            'Sleep is one of the most important activities for human health, yet scientists are still uncovering its deepest mysteries. Every night, when you close your eyes and drift off, your brain embarks on a complex journey through different stages of consciousness that are essential for memory, creativity, and physical restoration.',
            'The sleep cycle consists of four stages that repeat approximately every ninety minutes throughout the night. The first two stages are relatively light sleep, during which your heart rate slows and your body temperature drops. Stage three is deep sleep, often called slow-wave sleep, which is critical for physical recovery and immune function. Finally, there is REM (Rapid Eye Movement) sleep, the stage most closely associated with vivid dreaming.',
            'Recent research has revealed that during deep sleep, the brain activates a remarkable cleaning system called the glymphatic system. This network of channels allows cerebrospinal fluid to flush through brain tissue, removing toxic waste products that accumulate during waking hours. Among these waste products is beta-amyloid, a protein linked to Alzheimer\'s disease. Scientists believe that chronic sleep deprivation may increase the risk of neurodegenerative diseases precisely because the brain does not have enough time to clear these harmful substances.',
            'Memory consolidation is another crucial function of sleep. During the night, the hippocampus replays the day\'s experiences and transfers important information to long-term storage in the cortex. Studies have shown that students who sleep well after studying perform significantly better on exams than those who stay up all night cramming. This process is particularly active during REM sleep, which may explain why people who are deprived of this stage often struggle with creative problem-solving.',
            'Despite knowing how important sleep is, millions of people around the world suffer from chronic sleep deprivation. The World Health Organization has declared insufficient sleep a global public health epidemic. Experts recommend that adults aim for seven to nine hours of quality sleep each night, maintaining a consistent schedule even on weekends. Simple changes such as reducing screen time before bed, keeping the bedroom cool and dark, and avoiding caffeine in the afternoon can dramatically improve sleep quality and, by extension, overall health and cognitive performance.'
        ],
        questions: [
            {
                q: 'What is the primary function of the glymphatic system during deep sleep?',
                options: [
                    'To generate vivid dreams',
                    'To remove toxic waste products from the brain',
                    'To increase heart rate for physical recovery',
                    'To transfer memories to long-term storage'
                ],
                answer: 1
            },
            {
                q: 'According to the article, which stage of sleep is most closely associated with creative problem-solving?',
                options: [
                    'Stage one (light sleep)',
                    'Stage three (slow-wave sleep)',
                    'REM sleep',
                    'Stage two'
                ],
                answer: 2
            },
            {
                q: 'What does the article suggest about students who sleep well after studying?',
                options: [
                    'They forget information more quickly',
                    'They perform worse on creative tasks',
                    'They perform significantly better on exams',
                    'They need less sleep overall'
                ],
                answer: 2
            }
        ]
    },

    // ── Tuesday: History ──
    {
        id: 'hist-001',
        topic: 'History',
        day: 'Tuesday',
        title: 'The Library of Alexandria: Knowledge Lost and Found',
        body: [
            'The ancient Library of Alexandria was one of the greatest intellectual achievements of the classical world. Founded in the third century BCE in Egypt, it was not merely a collection of scrolls but an entire research institution dedicated to the pursuit of knowledge across every field known to the ancient world.',
            'The library was established under the patronage of the Ptolemaic dynasty, the Greek rulers of Egypt who succeeded Alexander the Great. Its first director, Demetrius of Phalerum, set about an ambitious programme of acquiring texts from across the Mediterranean world. Ships arriving in Alexandria\'s harbour were searched, and any books found on board were copied. The originals were kept in the library, and the copies were returned to their owners. At its peak, the library is believed to have held between 400,000 and 700,000 scrolls.',
            'The scholars who worked at the library made extraordinary contributions to human knowledge. Euclid wrote his foundational geometry text "Elements" there. Eratosthenes calculated the circumference of the Earth with remarkable accuracy using nothing more than shadows and basic geometry. Aristarchus proposed that the Earth revolves around the Sun, nearly two thousand years before Copernicus. The physician Herophilus conducted the first systematic dissections of the human body, advancing medical understanding dramatically.',
            'The destruction of the library is surrounded by legend and controversy. Contrary to popular belief, it was not destroyed in a single catastrophic event. Rather, it declined gradually over several centuries due to political instability, reduced funding, and occasional acts of violence. Julius Caesar\'s siege of Alexandria in 48 BCE resulted in a fire that destroyed part of the collection. Later, the library suffered further losses during various conflicts and political upheavals that plagued Roman and then Byzantine Egypt.',
            'Today, the legacy of the Library of Alexandria lives on in modern institutions. In 2002, the Egyptian government opened the Bibliotheca Alexandrina near the site of the original library, a stunning modern building designed to honour the spirit of the ancient institution. The new library houses millions of books, a planetarium, and multiple museums, serving as a symbol of the enduring human desire to collect, preserve, and share knowledge across generations.'
        ],
        questions: [
            {
                q: 'How did the library acquire many of its scrolls?',
                options: [
                    'By purchasing them from other libraries',
                    'By copying books found on ships and keeping the originals',
                    'By sending scholars to collect them from foreign lands',
                    'By commissioning new works from local authors'
                ],
                answer: 1
            },
            {
                q: 'Which achievement was accomplished by Eratosthenes at the library?',
                options: [
                    'Writing the foundational text on geometry',
                    'Proposing that the Earth revolves around the Sun',
                    'Calculating the circumference of the Earth',
                    'Conducting the first dissections of the human body'
                ],
                answer: 2
            },
            {
                q: 'According to the article, how was the library actually destroyed?',
                options: [
                    'In a single catastrophic fire set by Julius Caesar',
                    'By an earthquake that leveled the entire city',
                    'Through gradual decline over several centuries',
                    'By a deliberate act of a single ruler'
                ],
                answer: 2
            }
        ]
    },

    // ── Wednesday: Technology ──
    {
        id: 'tech-001',
        topic: 'Technology',
        day: 'Wednesday',
        title: 'How Artificial Intelligence Is Transforming Healthcare',
        body: [
            'Artificial intelligence is rapidly changing the landscape of modern healthcare, offering new tools that can diagnose diseases, predict patient outcomes, and even discover new medications. While the technology is still evolving, its impact on medicine has already been significant, and experts predict that it will fundamentally reshape how we approach health and well-being in the coming decades.',
            'One of the most promising applications of AI in healthcare is in medical imaging and diagnostics. Machine learning algorithms can now analyse X-rays, MRI scans, and pathology slides with remarkable accuracy, sometimes surpassing the performance of experienced radiologists. For example, AI systems have been developed that can detect early-stage lung cancer in CT scans, identify diabetic retinopathy in eye images, and spot skin cancer in photographs. These tools do not replace doctors but rather serve as powerful assistants, helping clinicians catch subtle abnormalities that might otherwise go unnoticed.',
            'Drug discovery is another area where AI is making a dramatic impact. Traditionally, developing a new medicine takes an average of ten to fifteen years and costs billions of dollars. AI can accelerate this process by analysing vast databases of molecular structures and predicting which compounds are most likely to be effective against a particular disease. During the COVID-19 pandemic, AI systems were used to identify potential drug candidates in a matter of weeks rather than years, demonstrating the technology\'s potential to respond rapidly to emerging health crises.',
            'Predictive analytics powered by AI can also help hospitals manage resources more efficiently and identify patients at risk of deterioration before critical events occur. By analysing patterns in electronic health records, AI systems can predict which patients are likely to develop complications, allowing doctors to intervene earlier. Some hospitals have already implemented AI-driven early warning systems that monitor vital signs in real time and alert clinical staff when a patient\'s condition begins to decline.',
            'Despite its enormous potential, AI in healthcare faces significant challenges. Issues of data privacy, algorithmic bias, and the need for rigorous clinical validation must be addressed before these tools can be widely adopted. There are also concerns about the "black box" nature of some AI models, where the reasoning behind a diagnosis or recommendation is not transparent. Nevertheless, the collaboration between human expertise and artificial intelligence represents one of the most exciting frontiers in modern medicine, with the potential to improve outcomes for millions of patients worldwide.'
        ],
        questions: [
            {
                q: 'According to the article, what role does AI play in medical imaging?',
                options: [
                    'It completely replaces radiologists',
                    'It serves as an assistant to help clinicians catch subtle abnormalities',
                    'It is only used for skin cancer detection',
                    'It is less accurate than human doctors in all cases'
                ],
                answer: 1
            },
            {
                q: 'How did AI contribute to the response to the COVID-19 pandemic?',
                options: [
                    'By developing vaccines directly',
                    'By replacing hospital staff during shortages',
                    'By identifying potential drug candidates within weeks',
                    'By predicting exactly when the pandemic would end'
                ],
                answer: 2
            },
            {
                q: 'What is one significant challenge mentioned regarding AI in healthcare?',
                options: [
                    'AI is too expensive for any hospital to use',
                    'AI has never been tested in clinical settings',
                    'The "black box" nature of some AI models lacks transparency',
                    'AI cannot process medical images'
                ],
                answer: 2
            }
        ]
    },

    // ── Thursday: Nature ──
    {
        id: 'nat-001',
        topic: 'Nature',
        day: 'Thursday',
        title: 'The Secret Language of Trees',
        body: [
            'For centuries, forests were viewed simply as collections of individual trees competing with one another for sunlight and nutrients. However, recent scientific discoveries have completely transformed our understanding of woodland ecosystems. It turns out that trees are far more social and cooperative than anyone previously imagined, communicating with each other through an underground network often called the "Wood Wide Web."',
            'At the heart of this communication system are mycorrhizal fungi, microscopic organisms that form symbiotic relationships with tree roots. These fungi extend their thread-like structures, called hyphae, through the soil, connecting the root systems of different trees. Through this fungal network, trees can share resources such as carbon, water, and nutrients. A large tree growing in full sunlight, for instance, may send surplus sugar through the network to a smaller tree struggling in the shade, effectively nurturing it.',
            'The ecologist Suzanne Simard, who pioneered much of this research, discovered that forests have "mother trees" — large, old trees that serve as central hubs in the underground network. These mother trees can recognise their own offspring among the seedlings surrounding them and preferentially send them resources. When a mother tree is dying, it can even transfer its carbon and nutrients to neighbouring trees, ensuring that its legacy continues to support the forest community.',
            'Trees also use chemical signals to communicate above ground. When a tree is attacked by insects, it can release volatile organic compounds into the air that serve as a warning to nearby trees. Receiving this chemical message, neighbouring trees begin producing defensive chemicals in their leaves before the insects even reach them. Some trees can even release specific compounds that attract the natural predators of the insects attacking them, effectively calling for help.',
            'These discoveries have profound implications for how we manage and protect forests. Clear-cutting large areas of forest destroys the underground networks that sustain tree communities, making it much harder for young trees to establish themselves. Conservation strategies that preserve mother trees and maintain the integrity of fungal networks are far more likely to result in healthy, resilient forests. Understanding the secret social life of trees reminds us that nature is built on cooperation and interconnection, not just competition.'
        ],
        questions: [
            {
                q: 'What is the "Wood Wide Web" referring to?',
                options: [
                    'An internet-based tool for studying forests',
                    'The underground fungal network that connects tree root systems',
                    'A series of branches that interlock between trees',
                    'A type of tree root that grows above ground'
                ],
                answer: 1
            },
            {
                q: 'What role do "mother trees" play in the forest?',
                options: [
                    'They prevent other trees from growing nearby',
                    'They only produce fruit and seeds',
                    'They serve as central hubs, sharing resources and supporting seedlings',
                    'They absorb all the nutrients from surrounding trees'
                ],
                answer: 2
            },
            {
                q: 'How do trees warn each other about insect attacks?',
                options: [
                    'By sending signals through their branches',
                    'By dropping their leaves as a visual signal',
                    'By releasing volatile organic compounds into the air',
                    'By changing the colour of their bark'
                ],
                answer: 2
            }
        ]
    },

    // ── Friday: Culture ──
    {
        id: 'cul-001',
        topic: 'Culture',
        day: 'Friday',
        title: 'Why Music Is a Universal Language',
        body: [
            'Music exists in every human culture that has ever been studied. From the complex orchestral traditions of Europe to the rhythmic drumming of West Africa, from the meditative ragas of India to the pentatonic melodies of East Asia, music is a fundamental part of what it means to be human. But why is this the case? What makes music so universal, and what does it reveal about our shared humanity?',
            'Researchers have found that certain aspects of music are remarkably consistent across cultures. A landmark study published in the journal Science analysed hundreds of songs from societies around the world and found that music associated with specific activities — lullabies, dance songs, healing songs, and love songs — shared similar acoustic features regardless of where they originated. Lullabies, for instance, tend to be slow, soft, and repetitive in nearly every culture, while dance music tends to be fast, rhythmic, and driving.',
            'The human brain appears to be wired for musical processing from birth. Newborn infants show preferences for consonant over dissonant harmonies, can detect changes in rhythm and melody, and are soothed by lullabies even when sung in unfamiliar languages. Brain imaging studies have shown that music activates a vast network of neural regions, including areas involved in emotion, memory, motor control, and social bonding. This widespread neural engagement may explain why music therapy has proven effective for conditions ranging from depression to stroke rehabilitation.',
            'Evolutionary psychologists have proposed several theories about why music evolved. Some argue that it served as a form of social bonding, helping early human groups coordinate activities and strengthen relationships. Others suggest that musical ability may have played a role in sexual selection, with individuals who could produce complex music signalling their cognitive fitness to potential partners. A third theory proposes that music evolved as a means of caring for infants, with the rhythmic, melodic qualities of lullabies helping to calm babies and promote sleep.',
            'Today, music continues to serve as a powerful bridge between cultures. International collaborations between artists from different traditions create new and exciting fusion genres, while platforms like streaming services allow people to explore music from every corner of the globe. Whether we are listening to a symphony, a pop song, or traditional folk music, the experience of music connects us to something deeply human — a shared emotional landscape that transcends language, geography, and time.'
        ],
        questions: [
            {
                q: 'What did the landmark study published in Science discover about music across cultures?',
                options: [
                    'That all cultures use the same musical instruments',
                    'That music for specific activities shares similar acoustic features worldwide',
                    'That Western music is the most universally appreciated',
                    'That music has no consistent patterns across cultures'
                ],
                answer: 1
            },
            {
                q: 'What evidence suggests that humans are born with musical abilities?',
                options: [
                    'Infants can play musical instruments from birth',
                    'All babies are born with perfect pitch',
                    'Newborns prefer consonant harmonies and can detect changes in rhythm',
                    'Babies cannot hear music until three months of age'
                ],
                answer: 2
            },
            {
                q: 'Which is NOT mentioned as a theory for why music evolved?',
                options: [
                    'Social bonding among early human groups',
                    'Sexual selection signalling cognitive fitness',
                    'A means of caring for infants through lullabies',
                    'A method for hunting wild animals'
                ],
                answer: 3
            }
        ]
    },

    // ── Saturday: Health ──
    {
        id: 'health-001',
        topic: 'Health',
        day: 'Saturday',
        title: 'The Power of Walking: A Simple Path to Better Health',
        body: [
            'In a world obsessed with high-intensity workouts and complex fitness routines, walking is often overlooked as a form of exercise. Yet a growing body of scientific evidence suggests that this simple, accessible activity may be one of the most effective ways to improve both physical and mental health. Walking requires no special equipment, can be done almost anywhere, and is suitable for people of all ages and fitness levels.',
            'Cardiovascular research has consistently shown that regular walking significantly reduces the risk of heart disease, stroke, and type 2 diabetes. A study published in the British Medical Journal found that people who walked briskly for at least thirty minutes a day had a 35 percent lower risk of heart disease compared to sedentary individuals. Walking also helps lower blood pressure and improve cholesterol levels, two key factors in cardiovascular health. Unlike running, walking places minimal stress on the joints, making it a sustainable long-term exercise option.',
            'The mental health benefits of walking are equally impressive. Research has demonstrated that a simple thirty-minute walk can reduce symptoms of anxiety and depression as effectively as some medication in mild cases. Walking outdoors in nature appears to be particularly beneficial, with studies showing that time spent in green spaces reduces levels of cortisol, the body\'s primary stress hormone. The Japanese practice of "shinrin-yoku," or forest bathing, which involves slow, mindful walks through woodland, has been shown to boost immune function and improve mood.',
            'Walking also has powerful effects on cognitive function. A study from Stanford University found that walking increased creative thinking by an average of sixty percent, with the effect persisting even after the walk ended. Other research has shown that regular walking can slow cognitive decline in older adults and may reduce the risk of developing dementia. Scientists believe that walking increases blood flow to the brain, stimulates the growth of new neurons, and promotes the release of brain-derived neurotrophic factor (BDNF), a protein essential for learning and memory.',
            'Health organisations worldwide recommend at least 150 minutes of moderate-intensity activity per week, and brisk walking is one of the easiest ways to meet this target. Starting with just ten minutes a day and gradually increasing duration and pace can lead to significant health improvements. Taking the stairs instead of the elevator, walking to the shops instead of driving, or enjoying an evening stroll after dinner are all simple ways to incorporate more walking into daily life. In the quest for better health, sometimes the simplest solutions are the most powerful.'
        ],
        questions: [
            {
                q: 'According to the study in the British Medical Journal, brisk walking for 30 minutes daily reduces heart disease risk by how much?',
                options: [
                    '15 percent',
                    '25 percent',
                    '35 percent',
                    '50 percent'
                ],
                answer: 2
            },
            {
                q: 'What does the Stanford University study say about walking and creativity?',
                options: [
                    'Walking has no effect on creative thinking',
                    'Walking increased creative thinking by an average of 60 percent',
                    'Walking only helps creativity when done indoors',
                    'Creativity decreases during walking but increases afterward'
                ],
                answer: 1
            },
            {
                q: 'What is "shinrin-yoku"?',
                options: [
                    'A type of high-intensity exercise from Japan',
                    'A meditation technique involving standing still',
                    'The Japanese practice of slow, mindful walks through woodland',
                    'A Japanese diet based on forest plants'
                ],
                answer: 2
            }
        ]
    },

    // ── Sunday: World ──
    {
        id: 'world-001',
        topic: 'World',
        day: 'Sunday',
        title: 'The Global Rise of Urban Farming',
        body: [
            'As the world\'s population continues to grow and more people move to cities, a quiet revolution is taking place on rooftops, in abandoned buildings, and along city streets around the globe. Urban farming — the practice of growing food within city boundaries — is emerging as a creative solution to some of the most pressing challenges of modern life, from food security and environmental sustainability to community health and social cohesion.',
            'The scale of urban farming varies enormously. At one end of the spectrum are small community gardens where neighbours come together to grow vegetables and herbs in shared plots. At the other end are high-tech vertical farms that use hydroponics, LED lighting, and computer-controlled environments to produce large quantities of leafy greens and herbs in multi-storey buildings. Singapore, a country that imports over ninety percent of its food, has become a global leader in vertical farming technology, with companies producing hundreds of tonnes of vegetables annually in climate-controlled indoor facilities.',
            'The environmental benefits of urban farming are substantial. By growing food close to where it is consumed, urban farms dramatically reduce the carbon emissions associated with transporting produce long distances. Many urban farms also use significantly less water than traditional agriculture, particularly those employing hydroponic systems, which can use up to ninety percent less water by recirculating nutrient-rich solutions. Additionally, urban green spaces help mitigate the urban heat island effect, absorb rainwater runoff, and provide habitat for pollinators such as bees and butterflies.',
            'Beyond environmental benefits, urban farms have proven to be powerful tools for building stronger communities. Community gardens create spaces where people of different ages, backgrounds, and cultures can work together, fostering social connections and a sense of shared purpose. Studies have shown that access to community gardens is associated with improved mental health, increased physical activity, and better nutrition, particularly in underserved neighbourhoods where fresh produce is often scarce. Educational programmes run by urban farms teach children about food systems and nutrition, instilling healthy habits from a young age.',
            'The future of urban farming looks increasingly promising. Advances in technology are making indoor farming more energy-efficient and cost-effective, while supportive government policies in cities such as Paris, Detroit, and Tokyo are encouraging the integration of food production into urban planning. As climate change threatens traditional agricultural regions and supply chains become more vulnerable to disruption, the ability to grow food locally in cities will only become more important. Urban farming may not replace rural agriculture entirely, but it offers a compelling complement that makes our cities greener, healthier, and more resilient.'
        ],
        questions: [
            {
                q: 'Why has Singapore become a leader in vertical farming technology?',
                options: [
                    'Because it has the most farmland in Asia',
                    'Because it imports over 90 percent of its food',
                    'Because its government banned traditional farming',
                    'Because it has the most sunshine hours in the world'
                ],
                answer: 1
            },
            {
                q: 'How much less water can hydroponic urban farms use compared to traditional agriculture?',
                options: [
                    'About 30 percent less',
                    'About 50 percent less',
                    'Up to 90 percent less',
                    'They use the same amount of water'
                ],
                answer: 2
            },
            {
                q: 'What social benefit of community gardens is mentioned in the article?',
                options: [
                    'They provide free housing for urban residents',
                    'They generate significant income for participants',
                    'They foster social connections among people of different backgrounds',
                    'They eliminate the need for grocery stores'
                ],
                answer: 2
            }
        ]
    }
];
