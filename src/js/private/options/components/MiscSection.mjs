// @flow strict
// $FlowFixMe[object-this-reference]
import {defineComponent, h} from 'vue';
import {Card, Form, FormItem, Input, InputNumber, Switch, Row, Col} from 'ant-design-vue';
import {t} from '../i18n.mjs';

export default defineComponent({
  name: 'MiscSection',
  props: {
    settings: {type: Object, required: true},
  },
  render() {
    const s = this.settings;
    const switchRow = (key, label) =>
      h(FormItem, null, () =>
        h('div', {class: 'ot-switch-line'}, [
          h(Switch, {checked: s[key], 'onUpdate:checked': (v) => { s[key] = v; }}),
          h('span', {class: 'ot-switch-label'}, label),
        ]),
      );

    return h(Card, {title: t('optionsTitleMisc', 'Misc'), class: 'ot-card'}, {
      default: () =>
        h(Form, {layout: 'vertical'}, () => [
          h(Row, {gutter: [16, 0]}, () => [
            h(Col, {xs: 24, sm: 12}, () => switchRow('autocopy', t('optionsTitleMiscAutocopy', 'Auto Copy'))),
            h(Col, {xs: 24, sm: 12}, () => switchRow('autoopen', t('optionsTitleMiscAutoopen', 'Auto Open'))),
            h(Col, {xs: 24, sm: 12}, () => switchRow('rlimit_enabled', t('optionsTitleMiscRlimitEnabled', 'Record Limit'))),
            h(Col, {xs: 24, sm: 12}, () => switchRow('show_execution_time', t('optionsTitleMiscShowExecutionTime', 'Show Execution Time'))),
            h(Col, {xs: 24, sm: 12}, () => switchRow('show_env_message', t('optionsTitleMiscShowEnvMessage', 'Show Env Message'))),
            h(Col, {xs: 24, sm: 12}, () => switchRow('hightlight_words', t('optionsTitleMiscHighlightWords', 'Highlight Words'))),
          ]),
          h(FormItem, {label: t('optionsTitleMiscRlimitValue', 'Limit Records')}, () =>
            h(InputNumber, {value: s.rlimit_value, 'onUpdate:value': (v) => { s.rlimit_value = v; }}, null),
          ),
          h(FormItem, {label: t('optionsTitleMiscHighlightWordsList', 'Highlight Words List')}, () =>
            h(Input, {
              value: (s.hightlight_words_list || []).join(', '),
              'onUpdate:value': (v) => { s.hightlight_words_list = v.split(',').map((x) => x.trim()).filter(Boolean); },
              placeholder: 'keyword1, keyword2, keyword3',
            }),
          ),
          h(Row, {gutter: 16}, () => [
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleMiscTermHeight', 'Terminal Height')}, () =>
                h(Input, {value: s.term_height, 'onUpdate:value': (v) => { s.term_height = v; }, placeholder: 'auto'}),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleMiscTermWidth', 'Terminal Width')}, () =>
                h(Input, {value: s.term_width, 'onUpdate:value': (v) => { s.term_width = v; }, placeholder: 'auto'}),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleMiscScreenBufferSize', 'Screen Buffer Size')}, () =>
                h(Input, {value: s.screen_buffer_size, 'onUpdate:value': (v) => { s.screen_buffer_size = v; }}),
              ),
            ),
          ]),
        ]),
    });
  },
});
