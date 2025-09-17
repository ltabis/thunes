-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- TABLE: account
-- ------------------------------

DEFINE TABLE account TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: account
-- ------------------------------

INSERT [ { currency: 'EUR', id: account:53aqmztn4uv2k5ef0ce3, name: 'Savings account', transaction_grid_sort_model: [] }, { currency: 'EUR', id: account:blnfdpsiwg7h85u98djz, name: 'Main account', transaction_grid_sort_model: [] } ];

-- ------------------------------
-- TABLE: allocation
-- ------------------------------

DEFINE TABLE allocation TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: allocation
-- ------------------------------

INSERT [ { amount: 200f, category: category:⟨savings-stocks⟩, id: allocation:5f7gl0il6zo63rxfclrz, name: 'Stocks', partition: partition:6amqogkpxkhuyyd74zfr }, { amount: 250f, category: category:⟨spare-time-activities-restaurants⟩, id: allocation:7sn3t6f4dqqsmz9bqldz, name: 'Restaurants', partition: partition:lgntu6brg5b40zq45s0f }, { amount: 30f, category: category:⟨car-insurance⟩, id: allocation:ewr8s9ij7f1t9421kt3c, name: 'Car insurence', partition: partition:0t6ekmleepglb3ztcicc }, { amount: 35f, category: category:⟨spare-time-activities-club⟩, id: allocation:lda3f1819j17myc0ow7d, name: 'Gym membership', partition: partition:lgntu6brg5b40zq45s0f }, { amount: 20f, category: category:⟨accommodation-insurance⟩, id: allocation:ne4ailga9dhiducpwefl, name: 'Home Insurence', partition: partition:0t6ekmleepglb3ztcicc }, { amount: 100f, category: category:⟨car-fuel⟩, id: allocation:o7jl5c648yha27oisj7j, name: 'Gaz', partition: partition:0t6ekmleepglb3ztcicc }, { amount: 300f, category: category:⟨spare-time-activities-entertainment⟩, id: allocation:os5ise14yqex8txlryve, name: 'Going Out !', partition: partition:lgntu6brg5b40zq45s0f }, { amount: 200f, category: category:savings, id: allocation:q3my82b0sazbfjcbpttn, name: 'Savings', partition: partition:6amqogkpxkhuyyd74zfr }, { amount: 500f, category: category:⟨everyday-life-food⟩, id: allocation:s94kx8gzrcbwfpkn36zm, name: 'Food', partition: partition:0t6ekmleepglb3ztcicc }, { amount: 20f, category: category:subscription, id: allocation:x5ey3ml3rv9wt00ujqe4, name: 'Movie subscription', partition: partition:lgntu6brg5b40zq45s0f }, { amount: 50f, category: category:⟨accommodation-energy⟩, id: allocation:yo33z2cvbjsgfw3gra8x, name: 'Electricity', partition: partition:0t6ekmleepglb3ztcicc }, { amount: 200f, category: category:⟨everyday-life-animals⟩, id: allocation:yw9yw5hsoscrlklm0p7l, name: 'Animal expenses', partition: partition:0t6ekmleepglb3ztcicc } ];

-- ------------------------------
-- TABLE: budget
-- ------------------------------

DEFINE TABLE budget TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: budget
-- ------------------------------

INSERT [ { accounts: [{ currency: 'EUR', id: account:blnfdpsiwg7h85u98djz, name: 'Main account', transaction_grid_sort_model: [] }, { currency: 'EUR', id: account:53aqmztn4uv2k5ef0ce3, name: 'Savings account', transaction_grid_sort_model: [] }], currency: 'EUR', id: budget:h7rxo5wv9cy6pe97cm3j, income: 2000f, name: 'Main budget', view: { allocations: false, expenses: true } } ];

-- ------------------------------
-- TABLE: category
-- ------------------------------

DEFINE TABLE category TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: category
-- ------------------------------

INSERT [ { color: 'orange', icon: 'accommodation', id: category:accommodation, name: 'Accommodation' }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-clean-service⟩, name: 'Home cleaning & services', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-energy⟩, name: 'Energy (electricity, gaz, fuel, heating...)', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-exceptional-expenses⟩, name: 'Exceptional expenses (moving, repair costs...)', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-insurance⟩, name: 'Home insurance', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-mortgage⟩, name: 'Mortgage', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-other⟩, name: 'Accommodation - other', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-rent⟩, name: 'Rent, charges', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-water⟩, name: 'Water', parent: category:accommodation }, { color: 'orange', icon: 'accommodation', id: category:⟨accommodation-works⟩, name: 'Furniture, repairs, maintenance', parent: category:accommodation }, { color: 'yellow', icon: 'car', id: category:car, name: 'Car & Motorcycle' }, { color: 'yellow', icon: 'car', id: category:⟨car-fine⟩, name: 'Fine', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-fuel⟩, name: 'Fuel', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-funding⟩, name: 'Funding', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-insurance⟩, name: 'Insurance', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-maintenance⟩, name: 'Maintenance & Repairs', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-other⟩, name: 'Car & Motorcycle - Other', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-parking⟩, name: 'Parking', parent: category:car }, { color: 'yellow', icon: 'car', id: category:⟨car-toll⟩, name: 'Toll', parent: category:car }, { color: 'green', icon: 'cashwithdrawal', id: category:⟨cash-withdrawal⟩, name: 'Cash Withdrawal' }, { color: 'pink', icon: 'educationandfamily', id: category:⟨education-and-family⟩, name: 'Education & Family' }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life⟩, name: 'Everyday Life' }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-animals⟩, name: 'Animals', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-care⟩, name: 'Well being (hairdresser, perfumes...)', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-clothes⟩, name: 'Clothes & accessories', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-diy⟩, name: 'DIY and gardening', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-electronics⟩, name: 'Electronics', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-food⟩, name: 'Food', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-laundromat⟩, name: 'Laundromat & pressing', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-media⟩, name: 'Books, CD/DVD, jewelry, toys...', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-other⟩, name: 'Everyday Life - Other', parent: category:⟨everyday-life⟩ }, { color: 'blue', icon: 'everydaylife', id: category:⟨everyday-life-sport⟩, name: 'Sports & arts equipment', parent: category:⟨everyday-life⟩ }, { color: 'orange', icon: 'giftanddonations', id: category:⟨gift-and-donations⟩, name: 'Gift & Donations' }, { color: 'green', icon: 'health', id: category:health, name: 'Health' }, { color: 'green', icon: 'health', id: category:⟨health-doctor⟩, name: 'Doctor & medical bills', parent: category:health }, { color: 'green', icon: 'health', id: category:⟨health-insurance⟩, name: 'Complementary health insurance', parent: category:health }, { color: 'green', icon: 'health', id: category:⟨health-lab⟩, name: 'Pharmacy & Lab', parent: category:health }, { color: 'green', icon: 'health', id: category:⟨health-other⟩, name: 'Health - Other', parent: category:health }, { color: 'green', icon: 'health', id: category:⟨health-senses⟩, name: 'Optical care, hearing...', parent: category:health }, { color: 'blue', icon: 'internalmovements', id: category:⟨internal-movements⟩, name: 'Internal Movements' }, { color: 'blue', icon: 'internalmovements', id: category:⟨internal-movements-external⟩, name: 'Movements to a third party', parent: category:⟨internal-movements⟩ }, { color: 'red', icon: 'loan', id: category:loan, name: 'Loan' }, { color: 'red', icon: 'loan', id: category:⟨loan-conso⟩, name: 'Consumer credit', parent: category:loan }, { color: 'red', icon: 'loan', id: category:⟨loan-student⟩, name: 'Student loan', parent: category:loan }, { color: 'grey', icon: 'other', id: category:other, name: 'Other' }, { color: 'blue', icon: 'professionalfee', id: category:⟨professional-fee⟩, name: 'Professional Fee' }, { color: 'red', icon: 'savings', id: category:savings, name: 'Savings' }, { color: 'red', icon: 'savings', id: category:⟨savings-bank⟩, name: 'Bank savings', parent: category:savings }, { color: 'red', icon: 'savings', id: category:⟨savings-crypto⟩, name: 'Crypto market', parent: category:savings }, { color: 'red', icon: 'savings', id: category:⟨savings-finance⟩, name: 'Finance savings (retirement...)', parent: category:savings }, { color: 'red', icon: 'savings', id: category:⟨savings-other⟩, name: 'Savings - Other', parent: category:savings }, { color: 'red', icon: 'savings', id: category:⟨savings-real-estate⟩, name: 'Real estate', parent: category:savings }, { color: 'red', icon: 'savings', id: category:⟨savings-stocks⟩, name: 'Stock market', parent: category:savings }, { color: 'pink', icon: 'sparetimeactivities', id: category:⟨spare-time-activities⟩, name: 'Spare-time Activities' }, { color: 'pink', icon: 'sparetimeactivities', id: category:⟨spare-time-activities-club⟩, name: 'Club / association (sport, hobby, art...)', parent: category:⟨spare-time-activities⟩ }, { color: 'pink', icon: 'sparetimeactivities', id: category:⟨spare-time-activities-entertainment⟩, name: 'Entertainment (cinema, theatre, bowling...)', parent: category:⟨spare-time-activities⟩ }, { color: 'pink', icon: 'sparetimeactivities', id: category:⟨spare-time-activities-other⟩, name: 'Spare-time Activities - Other', parent: category:⟨spare-time-activities⟩ }, { color: 'pink', icon: 'sparetimeactivities', id: category:⟨spare-time-activities-restaurants⟩, name: 'Restaurants, bars, nightclubs...', parent: category:⟨spare-time-activities⟩ }, { color: 'blue', icon: 'subscription', id: category:subscription, name: 'Subscription' }, { color: 'blue', icon: 'subscription', id: category:⟨subscription-journal⟩, name: 'Journal, revues...', parent: category:subscription }, { color: 'blue', icon: 'subscription', id: category:⟨subscription-multimedia⟩, name: 'Home multimedia (TV, internet...)', parent: category:subscription }, { color: 'blue', icon: 'subscription', id: category:⟨subscription-other⟩, name: 'Subscription - Other', parent: category:subscription }, { color: 'blue', icon: 'subscription', id: category:⟨subscription-phone⟩, name: 'Phone', parent: category:subscription }, { color: 'red', icon: 'taxes', id: category:taxes, name: 'Taxes' }, { color: 'red', icon: 'taxes', id: category:⟨taxes-employer⟩, name: 'Employer contributions', parent: category:taxes }, { color: 'red', icon: 'taxes', id: category:⟨taxes-housing⟩, name: 'Housing tax', parent: category:taxes }, { color: 'red', icon: 'taxes', id: category:⟨taxes-income⟩, name: 'Income tax', parent: category:taxes }, { color: 'red', icon: 'taxes', id: category:⟨taxes-other⟩, name: 'Taxes - Other', parent: category:taxes }, { color: 'red', icon: 'taxes', id: category:⟨taxes-property⟩, name: 'Property tax', parent: category:taxes }, { color: 'red', icon: 'taxes', id: category:⟨taxes-real-estate-wealth⟩, name: 'Real estate wealth tax', parent: category:taxes }, { color: 'yellow', icon: 'transport', id: category:transport, name: 'Transport' }, { color: 'yellow', icon: 'bed', id: category:⟨transport-accommodation⟩, name: 'Accommodation (hotel, camping...)', parent: category:transport }, { color: 'yellow', icon: 'bed', id: category:⟨transport-daily-transport⟩, name: 'Daily transport (metro, bus...)', parent: category:transport }, { color: 'yellow', icon: 'bed', id: category:⟨transport-long-range⟩, name: 'Long range travel', parent: category:transport }, { color: 'yellow', icon: 'bed', id: category:⟨transport-other⟩, name: 'Transport - Other', parent: category:transport }, { color: 'yellow', icon: 'bed', id: category:⟨transport-taxi⟩, name: 'Taxi', parent: category:transport }, { color: 'yellow', icon: 'transport', id: category:⟨transport-travel-agency⟩, name: 'Travel agency', parent: category:transport }, { color: 'yellow', icon: 'bed', id: category:⟨transport-vehicle-rental⟩, name: 'Vehicle rental', parent: category:transport } ];

-- ------------------------------
-- TABLE: partition
-- ------------------------------

DEFINE TABLE partition TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: partition
-- ------------------------------

INSERT [ { budget: budget:h7rxo5wv9cy6pe97cm3j, color: 'red', id: partition:0t6ekmleepglb3ztcicc, name: 'Needs' }, { budget: budget:h7rxo5wv9cy6pe97cm3j, color: '#2400ff', id: partition:6amqogkpxkhuyyd74zfr, name: 'Investments' }, { budget: budget:h7rxo5wv9cy6pe97cm3j, color: '#dbff00', id: partition:lgntu6brg5b40zq45s0f, name: 'Wants' } ];

-- ------------------------------
-- TABLE: settings
-- ------------------------------

DEFINE TABLE settings TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: settings
-- ------------------------------

INSERT [ { backups_path: '/tmp', id: settings:main, tags: [], theme: 'dark' } ];

-- ------------------------------
-- TABLE: tile
-- ------------------------------

DEFINE TABLE tile TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: tile
-- ------------------------------

INSERT [ { data: { budget: 'h7rxo5wv9cy6pe97cm3j', t: 'Pie' }, id: tile:gx1kdw1bhvvmyhl05u3a, order: 1, type: 'Budget' }, { data: { currency: 'EUR', t: 'Pie' }, id: tile:jcll73xru7ycxwgwpa10, order: 0, type: 'Currency' } ];

-- ------------------------------
-- TABLE: transaction
-- ------------------------------

DEFINE TABLE transaction TYPE ANY SCHEMALESS PERMISSIONS NONE;




-- ------------------------------
-- TABLE DATA: transaction
-- ------------------------------

INSERT [ { account: account:blnfdpsiwg7h85u98djz, amount: -52f, category: category:⟨gift-and-donations⟩, date: d'2025-09-17T16:52:08.954Z', description: 'Gift for my mother', id: transaction:1eu1tvgfouwvo460y4no, tags: [] }, { account: account:blnfdpsiwg7h85u98djz, amount: -532f, category: category:⟨savings-stocks⟩, date: d'2025-09-17T16:52:38.538Z', description: 'Stocks', id: transaction:2q6m3pwgz8nptz4yrxld, tags: [{ label: 'etf' }] }, { account: account:blnfdpsiwg7h85u98djz, amount: 2000f, category: category:other, date: d'2025-09-01T16:51:39.304Z', description: 'Salary', id: transaction:e7hqil1tbitbx29as0er, tags: [] }, { account: account:53aqmztn4uv2k5ef0ce3, amount: 100f, category: category:savings, date: d'2025-09-10T16:55:27.797Z', description: 'Monthly savings', id: transaction:nffcgaejo3xe4sjiteif, tags: [] }, { account: account:blnfdpsiwg7h85u98djz, amount: -150f, category: category:⟨everyday-life-food⟩, date: d'2025-09-17T16:50:42.070Z', description: 'Groceries', id: transaction:oitqg3316qzb1wnh7f2y, tags: [] }, { account: account:blnfdpsiwg7h85u98djz, amount: -70f, category: category:⟨car-fuel⟩, date: d'2025-09-12T16:50:42.070Z', description: 'Gaz', id: transaction:xx4boq78hp33pfs14xno, tags: [] } ];

