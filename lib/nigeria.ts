// Nigeria's 36 states and the FCT, with all 774 local government areas.
// Source: github.com/xosasx/nigerian-local-government-areas (MIT), checked against the official count per state.
// Delivery is anywhere in Nigeria, so every address is picked from this list, never typed freely.

export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof nigerianStates)[number];

export const lgasByState: Record<NigerianState, string[]> = {
  "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umu-Nneochi", "Umuahia North", "Umuahia South"],
  "Adamawa": ["Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat Enin", "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung Uko", "Ukanafun", "Uruan", "Urue Offong/Oruko", "Uyo"],
  "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue": ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno": ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakurr", "Yala"],
  "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  "Edo": ["Akoko Edo", "Egor", "Esan Central", "Esan North East", "Esan South East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Oredo", "Orhionmwon", "Ovia North East", "Ovia South West", "Owan East", "Owan West", "Uhunmwonde"],
  "Ekiti": ["Ado-Ekiti", "Efon", "Ekiti East", "Ekiti South West", "Ekiti West", "Emure", "Gbonyin", "Ido-Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi-Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji-River", "Udenu", "Udi", "Uzo-Uwani"],
  "FCT Abuja": ["Abaji", "Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
  "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  "Imo": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte Mbaise", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Onuimo", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West"],
  "Jigawa": ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  "Kaduna": ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  "Kano": ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Malam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dan Musa", "Dandume", "Danja", "Daura", "Dutsi", "Dutsin-Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  "Kebbi": ["Aliero", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Danko-Wasagu", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Yauri", "Zuru"],
  "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  "Kwara": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke-Ero", "Oyun", "Pategi"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Somolu", "Surulere"],
  "Nasarawa": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Munya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu", "Yewa North", "Yewa South"],
  "Ondo": ["Akoko North East", "Akoko North West", "Akoko South East", "Akoko South West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  "Osun": ["Aiyedire", "Atakunmosa East", "Atakunmosa West", "Ayedaade", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo-Otin", "Ola-Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North East", "Ibadan North West", "Ibadan South East", "Ibadan South West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Oorelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  "Plateau": ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Rivers": ["Abua-Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emohua", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  "Sokoto": ["Binji", "Bodinga", "Dange/Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  "Taraba": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kurmi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  "Zamfara": ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"],
};

/** Everyday names people search by, mapped to the local government area they sit in. */
export const areaAliases: Partial<Record<NigerianState, Record<string, string[]>>> = {
  "Lagos": {
    "Eti-Osa": ["Lekki", "Ajah", "Victoria Island", "VI", "Ikoyi", "Oniru"],
    "Lagos Mainland": ["Yaba", "Ebute Metta"],
    "Ikeja": ["Ikeja GRA", "Allen", "Opebi", "Alausa"],
    "Kosofe": ["Ojota", "Ketu", "Ogudu", "Mile 12"],
    "Alimosho": ["Egbeda", "Idimu", "Ikotun", "Igando", "Ipaja"],
    "Oshodi-Isolo": ["Oshodi", "Isolo", "Ejigbo"],
    "Amuwo-Odofin": ["Festac", "Satellite Town"],
    "Somolu": ["Shomolu", "Bariga"],
    "Surulere": ["Aguda", "Ojuelegba"],
    "Ojo": ["Alaba"],
    "Ajeromi-Ifelodun": ["Ajegunle"],
    "Lagos Island": ["Marina", "Idumota"],
    "Ibeju-Lekki": ["Lakowe", "Awoyaya"],
    "Mushin": ["Idi-Araba"],
  },
  "Rivers": {
    "Port Harcourt": ["PH", "D-Line", "Old GRA", "Borokiri", "Diobu", "Town"],
    "Obio/Akpor": ["Rumuola", "Rumuokoro", "Choba", "Woji", "Ada George"],
    "Eleme": ["Onne"],
  },
  "FCT Abuja": {
    "Abuja Municipal (AMAC)": ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Jabi", "Lugbe"],
    "Bwari": ["Kubwa", "Dutse"],
  },
  "Oyo": {
    "Ibadan North": ["Bodija", "UI"],
  },
  "Edo": {
    "Oredo": ["Benin City", "GRA"],
    "Egor": ["Uselu", "Ugbowo"],
  },
  "Delta": {
    "Warri South": ["Warri"],
    "Oshimili South": ["Asaba"],
    "Uvwie": ["Effurun"],
  },
  "Anambra": {
    "Awka South": ["Awka"],
    "Onitsha North": ["Onitsha"],
    "Onitsha South": ["Onitsha"],
  },
  "Cross River": {
    "Calabar Municipal": ["Calabar"],
  },
  "Imo": {
    "Owerri Municipal": ["Owerri"],
  },
  "Abia": {
    "Aba North": ["Aba"],
    "Aba South": ["Aba"],
    "Umuahia North": ["Umuahia"],
  },
  "Ogun": {
    "Ado-Odo/Ota": ["Ota", "Sango"],
    "Abeokuta South": ["Abeokuta"],
    "Obafemi Owode": ["Mowe", "Ibafo"],
  },
  "Kano": {
    "Kano Municipal": ["Kano city"],
  },
  "Plateau": {
    "Jos North": ["Jos"],
  },
  "Kwara": {
    "Ilorin West": ["Ilorin"],
  },
};

export const popularStates: NigerianState[] = ["Lagos", "Rivers", "FCT Abuja", "Bayelsa", "Delta", "Oyo"];

export const isNigerianState = (s: string): s is NigerianState => (nigerianStates as readonly string[]).includes(s);
export const isLgaOf = (state: string, lga: string) => isNigerianState(state) && lgasByState[state].includes(lga);

/** State capitals, so searching "Port Harcourt" or "Ibadan" finds the state. */
export const stateCapitals: Record<NigerianState, string> = {
  Abia: "Umuahia", Adamawa: "Yola", "Akwa Ibom": "Uyo", Anambra: "Awka", Bauchi: "Bauchi", Bayelsa: "Yenagoa", Benue: "Makurdi",
  Borno: "Maiduguri", "Cross River": "Calabar", Delta: "Asaba", Ebonyi: "Abakaliki", Edo: "Benin City", Ekiti: "Ado-Ekiti", Enugu: "Enugu",
  "FCT Abuja": "Abuja", Gombe: "Gombe", Imo: "Owerri", Jigawa: "Dutse", Kaduna: "Kaduna", Kano: "Kano", Katsina: "Katsina",
  Kebbi: "Birnin Kebbi", Kogi: "Lokoja", Kwara: "Ilorin", Lagos: "Ikeja", Nasarawa: "Lafia", Niger: "Minna", Ogun: "Abeokuta",
  Ondo: "Akure", Osun: "Osogbo", Oyo: "Ibadan", Plateau: "Jos", Rivers: "Port Harcourt", Sokoto: "Sokoto", Taraba: "Jalingo",
  Yobe: "Damaturu", Zamfara: "Gusau",
};
