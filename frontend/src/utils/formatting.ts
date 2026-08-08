import { Clue, CountryResponseDto } from '@/services/types';

export function formatNumber(value: string): string {
    const number = Number(value);
    if (number >= 1e12) {
        return `${(number / 1e12).toFixed(0)} trillion`;
    } else if (number >= 1e9) {
        return `${(number / 1e9).toFixed(0)} billion`;
    } else if (number >= 1e6) {
        return `${(number / 1e6).toFixed(0)} million`;
    } else if (number >= 1e3) {
        return `${(number / 1e3).toFixed(0)} thousand`;
    }
    return number.toString();
}

function isTrueClueValue(value: string | boolean): boolean {
    return value === true || String(value).toLowerCase() === 'true';
}

export function formatClue(clue: Clue, countries: CountryResponseDto[]): string {
    switch (clue.source) {
        case 'Area':
            switch (clue.key) {
                case 'area_gt':
                    return `Has an area greater than ${formatNumber(clue.value)} km²`;
                case 'area_lt':
                    return `Has an area less than ${formatNumber(clue.value)} km²`;
            }

        case 'Borders':
            switch (clue.key) {
                case 'borders':
                    const country = countries.find(c => c.code === clue.value);
                    return `Borders ${country ? country.name : clue.value}`;
                case 'nr_borders_gte':
                    return `Borders ${clue.value} or more countries`;
                case 'nr_borders_lte':
                    return `Borders ${clue.value} or fewer countries`;
                case 'is_landlocked':
                    return isTrueClueValue(clue.value)
                        ? 'Is landlocked'
                        : 'Has access to the sea';
            }

        case 'CarSide':
            return `People drive on the ${clue.value} side of the road`;

        case 'Cities':
            switch (clue.key) {
                case 'capital_city_population_gt':
                    return `The capital city has a population greater than ${formatNumber(clue.value)}`;
                case 'capital_city_population_lt':
                    return `The capital city has a population less than ${formatNumber(clue.value)}`;
                case 'largest_city_population_gt':
                    return `The largest city has a population greater than ${formatNumber(clue.value)}`;
                case 'largest_city_population_lt':
                    return `The largest city has a population less than ${formatNumber(clue.value)}`;
                case 'capital_city_is_largest_city':
                    return isTrueClueValue(clue.value)
                        ? 'The capital city is also the largest city'
                        : 'The capital city is not the largest city';
            }

        case 'Continent':
            return `Is in ${clue.value}`;

        case 'Currency':
            return `Uses ${clue.value} as its official currency`;

        case 'Flag':
            function formatConcatenatedColors(colors: string): string {
                const colors_on_flag = colors.split('|');
                const final_color = colors_on_flag.pop();
                const colors_to_connect = colors_on_flag.join(', ');
                return `${colors_to_connect} and ${final_color}`;
            }

            switch (clue.key) {
                case 'has_color':
                    return `Its flag contains the color ${clue.value}`;
                case 'has_at_least_colors':
                    return `Its flag contains at least these colors: ${formatConcatenatedColors(clue.value)}`;
                case 'has_exactly_colors':
                    return `Its flag contains exactly these colors: ${formatConcatenatedColors(clue.value)}`;
                case 'has_nr_colors':
                    return `Its flag has ${clue.value} colors`;
                case 'has_nr_colors_gte':
                    return `Its flag has ${clue.value} or more colors`;
                case 'has_nr_colors_lte':
                    return `Its flag has ${clue.value} or fewer colors`;
                case 'has_design':
                    return `Its flag contains a ${clue.value}`;
            }

        case 'FormulaOneGrandPrix':
            return isTrueClueValue(clue.value)
                ? 'Has hosted a Formula One Grand Prix'
                : 'Has never hosted a Formula One Grand Prix';

        case 'Language':
            return `Has ${clue.value} as an official language (de jure or de facto)`;

        case 'Membership':
            switch (clue.key) {
                case 'member_of':
                    if (clue.value === 'USSR') {
                        return `Was a member of the Soviet Union`;
                    }
                    return `Is a member of ${clue.value}`;
                case 'not_member_of':
                    if (clue.value === 'USSR') {
                        return `Was not a member of the Soviet Union`;
                    }
                    return `Is not a member of ${clue.value}`;
            }

        case 'Name':
            switch (clue.key) {
                case 'starts_with':
                    return `Its name starts with "${clue.value}"`;
                case 'ends_with':
                    return `Its name ends with "${clue.value}"`;
                case 'has_nr_letters':
                    return `Its name has exactly ${clue.value} letters`;
                case 'has_nr_letters_gte':
                    return `Its name has ${clue.value} or more letters`;
                case 'has_nr_letters_lte':
                    return `Its name has ${clue.value} or fewer letters`;
                case 'consists_multiple_words':
                    return isTrueClueValue(clue.value)
                        ? 'Its name consists of multiple words'
                        : 'Its name is a single word';
            }

        case 'ObesityRate':
            switch (clue.key) {
                case 'obesity_top':
                    return 'Is among the top 20 countries with the highest obesity rates';
                case 'obesity_bottom':
                    return 'Is among the 20 countries with the lowest obesity rates';
            }

        case 'OlympicsHost':
            switch (clue.key) {
                case 'has_hosted_olympics':
                    return 'Has hosted the Olympics';
                case 'has_hosted_summer_olympics':
                    return 'Has hosted the Summer Olympics';
                case 'has_hosted_winter_olympics':
                    return 'Has hosted the Winter Olympics';
            }

        case 'OlympicsMedals':
            switch (clue.key) {
                case 'summer_participated_gte':
                    return `Has participated in ${clue.value} or more Summer Olympics`;
                case 'summer_participated_lte':
                    return clue.value === '0'
                        ? 'Has never participated in a Summer Olympics'
                        : `Has participated in ${clue.value} or fewer Summer Olympics`;
                case 'summer_gold_gte':
                    return `Has won ${clue.value} or more Summer Olympics gold medals`;
                case 'summer_gold_lte':
                    return clue.value === '0'
                        ? 'Has never won a Summer Olympics gold medal'
                        : `Has won ${clue.value} or fewer Summer Olympics gold medals`;
                case 'summer_total_gte':
                    return `Has won ${clue.value} or more Summer Olympics medals`;
                case 'summer_total_lte':
                    return clue.value === '0'
                        ? 'Has never won a Summer Olympics medal'
                        : `Has won ${clue.value} or fewer Summer Olympics medals`;
                case 'winter_participated_gte':
                    return `Has participated in ${clue.value} or more Winter Olympics`;
                case 'winter_participated_lte':
                    return clue.value === '0'
                        ? 'Has never participated in a Winter Olympics'
                        : `Has participated in ${clue.value} or fewer Winter Olympics`;
                case 'winter_gold_gte':
                    return `Has won ${clue.value} or more Winter Olympics gold medals`;
                case 'winter_gold_lte':
                    return clue.value === '0'
                        ? 'Has never won a Winter Olympics gold medal'
                        : `Has won ${clue.value} or fewer Winter Olympics gold medals`;
                case 'winter_total_gte':
                    return `Has won ${clue.value} or more Winter Olympics medals`;
                case 'winter_total_lte':
                    return clue.value === '0'
                        ? 'Has never won a Winter Olympics medal'
                        : `Has won ${clue.value} or fewer Winter Olympics medals`;
                case 'combined_participated_gte':
                    return `Has participated in ${clue.value} or more Olympics`;
                case 'combined_participated_lte':
                    return clue.value === '0'
                        ? 'Has never participated in an Olympics'
                        : `Has participated in ${clue.value} or fewer Olympics`;
                case 'combined_gold_gte':
                    return `Has won ${clue.value} or more Olympic gold medals`;
                case 'combined_gold_lte':
                    return clue.value === '0'
                        ? 'Has never won an Olympic gold medal'
                        : `Has won ${clue.value} or fewer Olympic gold medals`;
                case 'combined_total_gte':
                    return `Has won ${clue.value} or more Olympic medals`;
                case 'combined_total_lte':
                    return clue.value === '0'
                        ? 'Has never won an Olympic medal'
                        : `Has won ${clue.value} or fewer Olympic medals`;
            }

        case 'Population':
            switch (clue.key) {
                case 'population_gt':
                    return `Has a population greater than ${formatNumber(clue.value)}`;
                case 'population_lt':
                    return `Has a population less than ${formatNumber(clue.value)}`;
            }

        case 'PopulationDensity':
            switch (clue.key) {
                case 'density_gt':
                    return `Has a population density greater than ${formatNumber(clue.value)} people per km²`;
                case 'density_lt':
                    return `Has a population density less than ${formatNumber(clue.value)} people per km²`;
                case 'density_top':
                    return 'Is among the 20 most densely populated countries';
                case 'density_bottom':
                    return 'Is among the 20 least densely populated countries';
            }

        case 'Timekeeping':
            switch (clue.key) {
                case 'start_of_week':
                    return `The week starts on ${clue.value}`;
                case 'uses_timezone':
                    return `Uses the ${clue.value} timezone`;
                case 'uses_nr_timezones__gte':
                    return `Spans ${clue.value} or more timezones`;
            }

        case 'WorldBank':
            switch (clue.key) {
                case 'gdp_gt':
                    return `Has a GDP greater than ${formatNumber(clue.value)} USD`;
                case 'gdp_lt':
                    return `Has a GDP less than ${formatNumber(clue.value)} USD`;
                case 'gdp_per_capita_gt':
                    return `Has a GDP per capita greater than ${formatNumber(clue.value)} USD`;
                case 'gdp_per_capita_lt':
                    return `Has a GDP per capita less than ${formatNumber(clue.value)} USD`;
                case 'gini_top':
                    return 'Is among the 20 countries with the highest income inequality';
                case 'gini_bottom':
                    return 'Is among the 20 countries with the lowest income inequality';
                case 'fertility_rate_gt':
                    return `Has a fertility rate greater than ${formatNumber(clue.value)} children per woman`;
                case 'fertility_rate_lt':
                    return `Has a fertility rate less than ${formatNumber(clue.value)} children per woman`;
                case 'co2_per_capita_gt':
                    return `Has CO2 emissions per capita greater than ${formatNumber(clue.value)} metric tons`;
                case 'co2_per_capita_lt':
                    return `Has CO2 emissions per capita less than ${formatNumber(clue.value)} metric tons`;
            }
    }
    return `${clue.source}: ${clue.key} = ${clue.value}`;
} 