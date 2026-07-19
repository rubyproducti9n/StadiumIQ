export const FIFA_STADIUMS = [
  {
    id: "metlife",
    name: "MetLife Stadium",
    city: "East Rutherford",
    state: "NJ",
    capacity: 82500,
    lat: 40.8135,
    lng: -74.0745,
    gates: [
      { id: "north", label: "North Gate", description: "Main entrance near parking lot A and NJ Transit train station" },
      { id: "south", label: "South Gate", description: "Entrance near parking lots F and G, close to retail stores" },
      { id: "east", label: "East Gate", description: "Entrance near parking lots D and E" },
      { id: "west", label: "West Gate", description: "Entrance near parking lots B and C, closest to Meadowlands station" }
    ],
    sections: ["A1", "A2", "B1", "B2", "C1", "C2", "VIP", "Media"],
    facilities: {
      foodCourts: [
        "Main Food Hall near Gate North, Section A1",
        "Concourse Food court near Gate East, Section B2",
        "Gluten-Free & Vegan Options near Gate West, Section C1"
      ],
      medicalAid: [
        "First Aid Station near Gate South, Section B1",
        "Emergency Medical Room near Gate West, Section C2"
      ],
      accessibility: [
        "ADA Elevators near Gate North, Section A2",
        "Wheelchair Check-in near Gate South, Section VIP"
      ],
      restrooms: [
        "Restrooms near Gate North, Section A1",
        "Restrooms near Gate South, Section B1",
        "Restrooms near Gate East, Section C1",
        "Restrooms near Gate West, Section C2"
      ]
    },
    transport: {
      metro: "Meadowlands Rail Line connects to Secaucus Junction for trains to NYC/New Jersey.",
      bus: "Coach USA Bus Service 351 runs from Port Authority Bus Terminal, NYC.",
      parking: "Lots A-G and Gold/Platinum permit zones surround the venue."
    }
  },
  {
    id: "att",
    name: "AT&T Stadium",
    city: "Arlington",
    state: "TX",
    capacity: 80000,
    lat: 32.7480,
    lng: -97.0930,
    gates: [
      { id: "north", label: "North Gate", description: "Entrance off Randol Mill Rd, near parking Lot 4" },
      { id: "south", label: "South Gate", description: "Entrance off Cowboys Way, near parking Lot 10" },
      { id: "east", label: "East Plaza Gate", description: "Main plaza entry near Arlington Conservation Zone" },
      { id: "west", label: "West Plaza Gate", description: "Main plaza entry off Collins St, near AT&T plaza" }
    ],
    sections: ["A1", "A2", "B1", "B2", "C1", "C2", "VIP", "Media"],
    facilities: {
      foodCourts: [
        "Barbecue Station near Gate West, Section A2",
        "Tex-Mex Eats near Gate East, Section B1",
        "Stadium Classics near Gate North, Section C1"
      ],
      medicalAid: [
        "First Aid Main Station near Gate South, Section VIP",
        "First Aid Satellite near Gate North, Section C2"
      ],
      accessibility: [
        "Access Ramps near West Plaza Gate, Section A1",
        "ADA Service Counter near Gate South, Section VIP"
      ],
      restrooms: [
        "Restrooms near Gate North, Section A2",
        "Restrooms near Gate South, Section B2",
        "Restrooms near Gate East, Section C2",
        "Restrooms near Gate West, Section VIP"
      ]
    },
    transport: {
      metro: "No direct metro. TRE (Trinity Railway Express) station is 6 miles away in CentrePort.",
      bus: "Arlington On-Demand Transit rideshare services are available on event days.",
      parking: "Over 12,000 official parking spaces across 15 numbered lots."
    }
  },
  {
    id: "sofi",
    name: "SoFi Stadium",
    city: "Inglewood",
    state: "CA",
    capacity: 70240,
    lat: 33.9535,
    lng: -118.3392,
    gates: [
      { id: "north", label: "North Gate", description: "Entrance near the Lake Park and parking Lot N" },
      { id: "south", label: "South Gate", description: "Entrance off Century Blvd and parking Lot S" },
      { id: "east", label: "East Gate", description: "Entrance near Prairie Ave and parking Lot E" },
      { id: "west", label: "West Gate", description: "Entrance near the American Airlines Plaza and YouTube Theater" }
    ],
    sections: ["A1", "A2", "B1", "B2", "C1", "C2", "VIP", "Media"],
    facilities: {
      foodCourts: [
        "LA Eats near Gate West, Section A1",
        "Culver City Tacos near Gate East, Section B2",
        "Fairfax Sausage near Gate North, Section C1"
      ],
      medicalAid: [
        "Medical Suite near Gate South, Section B2",
        "First Aid Lounge near Gate West, Section VIP"
      ],
      accessibility: [
        "Sensory Room near Gate North, Section A1",
        "ADA Elevators near Gate West, Section VIP"
      ],
      restrooms: [
        "Restrooms near Gate North, Section A2",
        "Restrooms near Gate South, Section B2",
        "Restrooms near Gate East, Section C2",
        "Restrooms near Gate West, Section A1"
      ]
    },
    transport: {
      metro: "K Line (Downtown Inglewood Station) with shuttle service to SoFi Stadium.",
      bus: "Metro Bus Lines 115, 117, and 212 operate near the stadium.",
      parking: "Zones Blue, Brown, Green, Orange, Purple, and Red surround the district."
    }
  }
];

export const DEFAULT_STADIUM = FIFA_STADIUMS[0];
